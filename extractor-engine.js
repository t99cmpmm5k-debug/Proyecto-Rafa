(function(root){
  "use strict";
  const U=root.GarminUtils;
  const V=root.GarminValidators;

  function compact(text){
    return U.cleanText(text).replace(/[ \t]+/g," ").trim();
  }

  function normalizeLabel(label){
    return U.normalize(label)
      .replace(/[.:]/g,"")
      .replace(/\s+/g," ")
      .trim();
  }

  function findAnchored(raw,labelPatterns,valuePatterns,parser,validator){
    const text=compact(raw);

    for(const label of labelPatterns){
      for(const value of valuePatterns){
        const after=new RegExp(`(?:${label})[\\s\\S]{0,45}?(${value})`,"i");
        const before=new RegExp(`(${value})[\\s\\S]{0,45}?(?:${label})`,"i");

        for(const regex of [after,before]){
          const m=text.match(regex);
          if(!m)continue;
          const parsed=parser(m[1]);
          if(parsed!=null && validator(parsed)){
            return {value:parsed,source:m[0],confidence:.98};
          }
        }
      }
    }
    return null;
  }

  function numberParser(value){ return U.num(value); }
  function paceParser(value){ return U.pace(value); }
  function durationParser(value){ return U.duration(value); }

  function distance(raw){
    return findAnchored(
      raw,
      ["distancia(?: recorrida| real)?"],
      ["[0-9]{1,3}[,.][0-9]{1,2}\\s*km"],
      numberParser,
      V.distance
    );
  }

  function avgHeartRate(raw){
    const text=compact(raw);
    const patterns=[
      /frecuencia cardiaca media[\s\S]{0,35}?((?:[3-9][0-9]|1[0-9]{2}|2[0-4][0-9])\s*(?:ppm|bpm))/i,
      /((?:[3-9][0-9]|1[0-9]{2}|2[0-4][0-9])\s*(?:ppm|bpm))[\s\S]{0,35}?frecuencia cardiaca media/i,
      /fc media[\s\S]{0,25}?((?:[3-9][0-9]|1[0-9]{2}|2[0-4][0-9])\s*(?:ppm|bpm))/i,
      /((?:[3-9][0-9]|1[0-9]{2}|2[0-4][0-9])\s*(?:ppm|bpm))[\s\S]{0,25}?fc media/i
    ];

    for(const regex of patterns){
      const m=text.match(regex);
      if(!m)continue;
      if(/max\.?|maxima/.test(normalizeLabel(m[0])))continue;
      const value=numberParser(m[1]);
      if(V.heartRate(value))return{value,source:m[0],confidence:.99};
    }
    return null;
  }

  function maxHeartRate(raw){
    const text=normalizeLabel(compact(raw));
    const valueToken="((?:[3-9][0-9]|1[0-9]{2}|2[0-4][0-9])\s*(?:ppm|bpm)?)";
    const labels=[
      "frecuencia\s*cardiaca\s*(?:maxima|max)",
      "frec\s*cardiaca\s*(?:maxima|max)",
      "fc\s*(?:maxima|max)",
      "max\s*fc"
    ];

    for(const label of labels){
      const patterns=[
        new RegExp(`(?:${label})[\s\S]{0,55}?${valueToken}`,"i"),
        new RegExp(`${valueToken}[\s\S]{0,55}?(?:${label})`,"i")
      ];
      for(const regex of patterns){
        const match=text.match(regex);
        if(!match)continue;
        const value=numberParser(match[1]);
        if(V.heartRate(value))return {value,source:match[0],confidence:.995};
      }
    }

    // Rescate por líneas: Garmin suele mostrar el valor justo encima o debajo
    // de la etiqueta y Tesseract puede perder "ppm" o separar las palabras.
    const lines=U.linesOf(raw);
    for(let i=0;i<lines.length;i++){
      const label=normalizeLabel(lines[i]);
      if(!/(?:frecuencia|frec|fc).{0,18}(?:maxima|max)|(?:maxima|max).{0,18}fc/.test(label))continue;
      for(let d=0;d<=2;d++){
        for(const j of [i-d,i+d]){
          if(j<0||j>=lines.length)continue;
          const nums=String(lines[j]).match(/\b(?:[3-9][0-9]|1[0-9]{2}|2[0-4][0-9])\b/g)||[];
          for(const token of nums){
            const value=Number(token);
            if(V.heartRate(value))return {value,source:`${lines[i]} | ${lines[j]}`,confidence:.985};
          }
        }
      }
    }
    return null;
  }

  function avgPace(raw){
    return findAnchored(
      raw,
      [
        "ritmo medio(?: en movimiento)?",
        "ritmo promedio",
        "ritmo del recorrido",
        "ritmo medio de carrera"
      ],
      ["[0-9]{1,2}\\s*[:.]\\s*[0-5][0-9]\\s*\\/\\s*km"],
      paceParser,
      V.pace
    );
  }

  function totalTime(raw){
    return findAnchored(
      raw,
      [
        "tiempo total",
        "duracion total",
        "tiempo de actividad",
        "tiempo del recorrido"
      ],
      ["(?:[0-9]{1,2}:)?[0-9]{1,3}:[0-5][0-9]"],
      durationParser,
      V.duration
    );
  }

  function calories(raw){
    const text=normalizeLabel(compact(raw));

    // Highest priority: total calories. Accents and punctuation are already removed.
    const totalPatterns=[
      /(?:calorias totales|total de calorias quemadas|total de calorias|total calorias)[\s\S]{0,45}?([0-9]{2,5})(?:\s*kcal)?/i,
      /([0-9]{2,5})(?:\s*kcal)?[\s\S]{0,45}?(?:calorias totales|total de calorias quemadas|total de calorias|total calorias)/i
    ];

    for(const regex of totalPatterns){
      const match=text.match(regex);
      if(!match)continue;
      if(/calorias en reposo/.test(match[0]))continue;
      const value=numberParser(match[1]);
      if(V.calories(value)){
        return {value,source:match[0],confidence:.99};
      }
    }

    // Fallback only when total calories are not visible.
    const activePatterns=[
      /calorias activas[\s\S]{0,35}?([0-9]{2,5})(?:\s*kcal)?/i,
      /([0-9]{2,5})(?:\s*kcal)?[\s\S]{0,35}?calorias activas/i
    ];

    for(const regex of activePatterns){
      const match=text.match(regex);
      if(!match)continue;
      const value=numberParser(match[1]);
      if(V.calories(value)){
        return {value,source:match[0],confidence:.96};
      }
    }

    return null;
  }

  function cadence(raw){
    return findAnchored(
      raw,
      ["cadencia media de carrera","cadencia media"],
      ["[0-9]{2,3}\\s*(?:ppm|spm)"],
      numberParser,
      V.cadence
    );
  }

  function temperature(raw){
    return findAnchored(
      raw,
      ["temperatura media","temperatura"],
      ["-?[0-9]{1,2}(?:[,.][0-9])?\\s*°?\\s*c"],
      numberParser,
      V.temperature
    );
  }

  function elevation(raw){
    return findAnchored(
      raw,
      ["ascenso total","desnivel positivo","ganancia de altura"],
      ["[0-9]{1,5}\\s*m"],
      numberParser,
      V.elevation
    );
  }

  root.GarminExtractor={
    distance,avgHeartRate,maxHeartRate,avgPace,totalTime,
    calories,cadence,temperature,elevation
  };
})(window);