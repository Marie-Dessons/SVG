export const drawGrid = (ctx, size, width, height) => {
  if (size <= 0) return;

  ctx.save();
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;

  for (let x = size; x < width; x += size) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = size; y < height; y += size) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
};

export const getMousePos = (canvas, e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const pos = {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };

  if (e.touches && e.touches[0]) {
    pos.x = (e.touches[0].clientX - rect.left) * scaleX;
    pos.y = (e.touches[0].clientY - rect.top) * scaleY;
  }

  return pos;
};

export const drawPathBeziers = (ctx, path) => {
  if (path.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  ctx.strokeStyle = path[0].color || "black";

  for (let i = 1; i < path.length; i += 3) {
    ctx.bezierCurveTo(
      path[i].x,
      path[i].y,
      path[i + 1].x,
      path[i + 1].y,
      path[i + 2].x,
      path[i + 2].y
    );
  }

  if (path[0].fill) {
    ctx.fillStyle = path[0].color || "black";
    ctx.fill();
  }
  ctx.strokeStyle = path[0].color || "black";
  ctx.stroke();
};

export const drawPath = (ctx, path) => {
  if (path[0].type === "M") {
    drawPathBeziers(ctx, path);
    return;
  }
  if (path.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);

  if (path[0].polygone) path = [...path, path[0]];

  if (path[0].fill) {
    ctx.fillStyle = path[0].color || "black";
    ctx.fill();
  }
  ctx.stroke();
};

export const drawControlPoints = (ctx, path,realSelectedPoint) => {
  ctx.save();
  var len = path.length
  if (path[0].polygone) {
    var pathControl = [];

    // Ajouter des points de contrôle intermédiaires au milieu de chaque côté
    for (let i = 0; i < path.length; i++) {
      const nextIndex = (i + 1) % path.length;
      const midX = (path[i].x + path[nextIndex].x) / 2;
      const midY = (path[i].y + path[nextIndex].y) / 2;
      pathControl.push({
        ...path[i],
        x: midX,
        y: midY,
        type: "middle", // Indicateur pour différencier les points intermédiaires
        middle: [i, nextIndex],
      });
    }

    path = [...path, ...pathControl];
  }
  if (path[0].type === "M") {
    let pathControl = [];

    // Ajouter des points de contrôle intermédiaires au milieu de chaque côté
    for (let i = 0; i < path.length - 1; i += 3) {
      const nextIndex = (i + 2) % path.length;
      const { x, y } = getBezierPoint(
        path[i].x,
        path[i].y,
        path[(i + 1) % path.length].x,
        path[(i + 1) % path.length].y,
        path[(i + 2) % path.length].x,
        path[(i + 2) % path.length].y,
        path[(i + 3) % path.length].x,
        path[(i + 3) % path.length].y,
        0.5
      );
      pathControl.push({
        ...path[i],
        x,
        y,
        type: "middle", // Indicateur pour différencier les points intermédiaires
        middle: [i, nextIndex], //
        //  toAdd:[ { ...path[i ], type:"C2", },{ ...path[i], type:"M",x,y,    },{...path[(i+3)%  path.length ], type:"C"}],
      });
    }

    path = [...path, ...pathControl];
  }

  path.forEach((point, index) => {
    if ((index===len-1  )
    || (point.type === "C" &&   (realSelectedPoint?.index+1===len ? 1  :   realSelectedPoint?.index+1) !== (index) )
    || (point.type === "C2"  &&   (realSelectedPoint?.index===0 ? len -2   :   realSelectedPoint?.index-1) !== (index)) ) return

    ctx.fillStyle =
      point.type === "C" || point.type === "C2" || point.type === "middle"
        ? "#fff"
        : (  realSelectedPoint?.index===index   ?"#888"  : "#ccc"    );
    ctx.strokeStyle = point.type !== "middle" ? "#000" : "#2196F3";
    ctx.lineWidth = point.type === "C" || point.type === "C2" ? 1 : 2;

    ctx.beginPath();
    ctx.arc(
      point.x,
      point.y,
      point.type === "C" || point.type === "C2" || point.type === "middle"
        ? 4
        : 8,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    if (point.type === "C" &&   (realSelectedPoint?.index+1===len ? 1  :   realSelectedPoint?.index+1)===index ) {
      ctx.beginPath();
      ctx.moveTo(path[index - 1].x, path[index - 1].y);
      ctx.lineTo(path[index].x, path[index].y);

      ctx.strokeStyle = "#4CAF50";
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (point.type === "C2"  &&  (realSelectedPoint?.index===0 ? len -2   :   realSelectedPoint?.index-1) === (index)) {
      ctx.beginPath();
      ctx.moveTo(path[index].x, path[index].y);
      ctx.lineTo(path[index + 1].x, path[index + 1].y);

      ctx.strokeStyle = "#4CAF50";
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (point.type === "bezier" && index === 0) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      ctx.lineTo(path[1].x, path[1].y);
      ctx.moveTo(path[3].x, path[3].y);
      ctx.lineTo(path[2].x, path[2].y);
      ctx.strokeStyle = "#4CAF50";
      ctx.strokeWidth = path[0].width;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  ctx.restore();
};

export const findControlPoint = (path, pos) => {
  const threshold = 8;

  if (path[0].polygone) {
    var pathControl = [];

    // Ajouter des points de contrôle intermédiaires au milieu de chaque côté
    for (let i = 0; i < path.length; i++) {
      const nextIndex = (i + 1) % path.length;
      const midX = (path[i].x + path[nextIndex].x) / 2;
      const midY = (path[i].y + path[nextIndex].y) / 2;
      pathControl.push({
        ...path[i],
        x: midX,
        y: midY,
        type: "middle", // Indicateur pour différencier les points intermédiaires
        middle: [i, nextIndex],
      });
    }

    path = [...path, ...pathControl];
  }
  if (path[0].type === "M") {
    let pathControl = [];

    // Ajouter des points de contrôle intermédiaires au milieu de chaque côté
    for (let i = 0; i < path.length; i += 3) {
      const nextIndex = (i + 1) % path.length;
      const { x, y ,x1,y1, x2,y2} = getBezierPoint(
        path[i].x,
        path[i].y,
        path[(i + 1) % path.length].x,
        path[(i + 1) % path.length].y,
        path[(i + 2) % path.length].x,
        path[(i + 2) % path.length].y,
        path[(i + 3) % path.length].x,
        path[(i + 3) % path.length].y,
        0.5
      );
      pathControl.push({
        ...path[i],
        x,
        y,
        type: "middle", // Indicateur pour différencier les points intermédiaires
        middle: [i, nextIndex], //
        toAdd: [
          { ...path[i], type: "C2" ,x:x1,y:y1},
          { ...path[i], type: "F", x, y },
          { ...path[(i + 3) % path.length], type: "C",x:x2,y:y2 },
        ],
      });
    }

    path = [...path, ...pathControl];
  }

  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    const distance = Math.sqrt(
      Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2)
    );
    if (distance < threshold) {
      return { ...point, index: i };
    }
  }

  return null;
};

const getBezierPoint = (x0, y0, cx1, cy1, cx2, cy2, x1, y1, p,withoutTangent=false) => {



  // Calcul de (1 - p)
  const oneMinusP = 1 - p;

  // Calcul des coordonnées x et y du point sur la courbe de Bézier
  const xp =
    oneMinusP ** 3 * x0 +
    3 * oneMinusP ** 2 * p * cx1 +
    3 * oneMinusP * p ** 2 * cx2 +
    p ** 3 * x1;

  const yp =
    oneMinusP ** 3 * y0 +
    3 * oneMinusP ** 2 * p * cy1 +
    3 * oneMinusP * p ** 2 * cy2 +
    p ** 3 * y1;


    if(!withoutTangent){
var l0  = Math.sqrt(   (cx1- x0) *(cx1-x0) + (cy1-y0)*(cy1-y0) )


      var tg =  getBezierPoint(x0, y0, cx1, cy1, cx2, cy2, x1, y1, p+0.00001,true)
      var dx = tg.x -xp
      var dy = tg.y -yp

      var l = Math.sqrt(  dx*dx +dy*dy  )

      var nx1 = xp- 0.25* l0* dx/l
      var ny1 = yp- 0.25*  l0* dy/l  

      var nx2 = xp+  0.25* l0* dx/l
      var ny2 = yp+   0.25*l0* dy/l  
      return { x: xp, y: yp ,x1 :nx1,y1 :ny1, x2:nx2, y2:ny2};
      }


  return { x: xp, y: yp };
};

export const updatePathPoint = (path, index, newPos) => {
  const updatedPath = [...path];

  var { x, y } = updatedPath[index];

  if (index === 0 && updatedPath[0].type === "M")
    updatedPath[updatedPath.length - 1] = {
      ...updatedPath[updatedPath.length - 1],
      ...newPos,
    };
  if (index === updatedPath.length - 1 && updatedPath[0].type === "M")
    updatedPath[0] = { ...updatedPath[0], ...newPos };
  updatedPath[index] = { ...updatedPath[index], ...newPos };

  if (updatedPath[index].type === "M" || updatedPath[index].type === "F") {
    var dx = newPos.x - x;
    var dy = newPos.y - y;

    var indexC = index + 1;
    var indexC2 = index - 1;

    if (indexC2 < 0) indexC2 = updatedPath.length - 2;
    if (indexC >= updatedPath.length) indexC = 1;

    updatedPath[indexC2] = {
      ...updatedPath[indexC2],
      x: dx + updatedPath[indexC2].x,
      y: dy + updatedPath[indexC2].y,
    };
    updatedPath[indexC] = {
      ...updatedPath[indexC],
      x: dx + updatedPath[indexC].x,
      y: dy + updatedPath[indexC].y,
    };
  }


if( updatedPath[index].type === "C"  || updatedPath[index].type === "C2")
{
  var indexP
  var indexO
      if(updatedPath[index].type === "C" )
      {
        indexP=  index-1
        indexO = indexP-1 
        if(indexO<0)  indexO =updatedPath.length-2
      }
      if(updatedPath[index].type === "C2" )
        {
          indexP=  index+1
          if(indexP===updatedPath.length-1) indexP=0
          indexO = indexP+1 
          if(indexO<0)  indexO =updatedPath.length-2
        }

   if(updatedPath[indexP].solidaire)
    {
        let dx = updatedPath[indexP].x - updatedPath[index].x
        let dy = updatedPath[indexP].y - updatedPath[index].y
        let l = Math.sqrt( dx*dx + dy*dy)
        dx/=l
        dy/=l

        let d0x = updatedPath[indexP].x - updatedPath[indexO].x
        let d0y = updatedPath[indexP].y - updatedPath[indexO].y
        let l0 = Math.sqrt( d0x*d0x + d0y*d0y)
        
        updatedPath[indexO].x = updatedPath[indexP].x  + l0 *dx
 
        updatedPath[indexO].y = updatedPath[indexP].y  + l0 *dy


    }     
    

}



  return updatedPath;
};

export const drawSelectionBox = (ctx, path) => {
  const bounds = getPathBounds(path);
  
  // Dessiner le rectangle de sélection
  ctx.strokeStyle = "#0066ff";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  ctx.setLineDash([]);

  // Dessiner les poignées de redimensionnement
  const handleSize = 8;
  const handles = [
    { x: bounds.minX, y: bounds.minY }, // Top Left
    { x: bounds.maxX, y: bounds.minY }, // Top Right
    { x: bounds.minX, y: bounds.maxY }, // Bottom Left
    { x: bounds.maxX, y: bounds.maxY }  // Bottom Right
  ];

  // Dessiner le bouton de rotation
  const rotationButtonRadius = 10;
  const rotationButtonOffset = 30; // Distance du centre du bouton par rapport au bord supérieur
  const rotationButtonX = (bounds.minX + bounds.maxX) / 2;
  const rotationButtonY = bounds.minY - rotationButtonOffset;

  // Dessiner la ligne du bouton de rotation
  ctx.beginPath();
  ctx.setLineDash([]);
  ctx.strokeStyle = "#0066ff";
  ctx.moveTo(rotationButtonX, bounds.minY);
  ctx.lineTo(rotationButtonX, rotationButtonY);
  ctx.stroke();

  // Dessiner le cercle du bouton de rotation
  ctx.beginPath();
  ctx.arc(rotationButtonX, rotationButtonY, rotationButtonRadius, 0, 2 * Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#0066ff";
  ctx.stroke();

  // Dessiner l'icône de rotation dans le cercle
  ctx.beginPath();
  ctx.arc(rotationButtonX, rotationButtonY, rotationButtonRadius * 0.6, 0, 1.5 * Math.PI);
  ctx.strokeStyle = "#0066ff";
  ctx.stroke();
  
  // Dessiner la flèche de rotation
  const arrowSize = 4;
  ctx.beginPath();
  ctx.moveTo(rotationButtonX + rotationButtonRadius * 0.6, rotationButtonY);
  ctx.lineTo(rotationButtonX + rotationButtonRadius * 0.6 + arrowSize, rotationButtonY - arrowSize);
  ctx.lineTo(rotationButtonX + rotationButtonRadius * 0.6 + arrowSize, rotationButtonY + arrowSize);
  ctx.fillStyle = "#0066ff";
  ctx.fill();

  // Dessiner les poignées de redimensionnement
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#0066ff";
  ctx.lineWidth = 2;

  handles.forEach(handle => {
    ctx.beginPath();
    ctx.rect(
      handle.x - handleSize/2,
      handle.y - handleSize/2,
      handleSize,
      handleSize
    );
    ctx.fill();
    ctx.stroke();
  });

  // Retourner les informations sur le bouton de rotation pour la détection des clics
  return {
    rotationButton: {
      x: rotationButtonX,
      y: rotationButtonY,
      radius: rotationButtonRadius
    }
  };
};

export const drawPreview = (ctx, path) => {
  const bounds = getPathBounds(path);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  ctx.save();
  ctx.font = "12px Arial";
  ctx.fillStyle = "#666";
  ctx.fillText(
    `${Math.round(width)}px × ${Math.round(height)}px`,
    bounds.maxX + 10,
    bounds.maxY
  );
  ctx.restore();
};

const percPoint = (point1, point2, perc) => {
  return {
    ...point1,
    x: point1.x * perc + point2.x * (1 - perc),
    y: point1.y * perc + point2.y * (1 - perc),
  };
};

export const createShape = (
  start,
  end,
  shape,
  strokeWidth,
  fill,
  color,
  borderRadius = 0
) => {
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  const centerX = (start.x + end.x) / 2;
  const centerY = (start.y + end.y) / 2;

  var points = [];
  const commonProps = { width: strokeWidth, fill, color, borderRadius };

  switch (shape.id) {
    case "circle": {
      const radius = Math.min(width, height) / 2;
      for (let i = 0; i <= 360; i += 5) {
        const angle = (i * Math.PI) / 180;
        points.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          ...commonProps,
        });
      }
      break;
    }
    case "square": {
      const size = Math.min(width, height);
      const halfSize = size / 2;
      const squareCenterX = start.x + (end.x > start.x ? halfSize : -halfSize);
      const squareCenterY = start.y + (end.y > start.y ? halfSize : -halfSize);

      if (borderRadius > 0) {
        const br = Math.min(borderRadius, size / 2);
        const steps = 5;

        const createArc = (centerX, centerY, startAngle, endAngle) => {
          const points = [];
          for (let i = 0; i <= steps; i++) {
            const angle = startAngle + (endAngle - startAngle) * (i / steps);
            points.push({
              x: centerX + br * Math.cos(angle),
              y: centerY + br * Math.sin(angle),
              ...commonProps,
            });
          }
          return points;
        };

        points.push(
          ...createArc(
            squareCenterX + halfSize - br,
            squareCenterY - halfSize + br,
            -Math.PI / 2,
            0
          ),
          ...createArc(
            squareCenterX + halfSize - br,
            squareCenterY + halfSize - br,
            0,
            Math.PI / 2
          ),
          ...createArc(
            squareCenterX - halfSize + br,
            squareCenterY + halfSize - br,
            Math.PI / 2,
            Math.PI
          ),
          ...createArc(
            squareCenterX - halfSize + br,
            squareCenterY - halfSize + br,
            Math.PI,
            (3 * Math.PI) / 2
          )
        );

        points.push(points[0]);
      } else {
        points.push(
          {
            x: squareCenterX - halfSize,
            y: squareCenterY - halfSize,
            ...commonProps,
          },
          {
            x: squareCenterX + halfSize,
            y: squareCenterY - halfSize,
            ...commonProps,
          },
          {
            x: squareCenterX + halfSize,
            y: squareCenterY + halfSize,
            ...commonProps,
          },
          {
            x: squareCenterX - halfSize,
            y: squareCenterY + halfSize,
            ...commonProps,
          },
          {
            x: squareCenterX - halfSize,
            y: squareCenterY - halfSize,
            ...commonProps,
          }
        );
      }
      break;
    }
    case "triangle": {
      const radius = Math.min(width, height) / 2; // Rayon du triangle (demi-longueur)
      const angleOffset = -Math.PI / 2; // Rotation initiale pour que le triangle pointe vers le haut

      // Calcul des sommets du triangle équilatéral
      for (let i = 0; i < 3; i++) {
        const angle = (i * (2 * Math.PI)) / 3 + angleOffset;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        points.push({ x, y, type: "vertex", ...commonProps });
      }
      points[0].polygone = true;

      break;
    }
    case "circle_beziers":
      const radius = Math.min(width, height) / 2; // Rayon du triangle (demi-longueur)
      const k = radius * 0.552284749831;
      // Calcul des sommets du triangle équilatéral

      points = [
        { x: centerX, y: centerY - radius, type: "M", ...commonProps },
        { x: centerX + k, y: centerY - radius, type: "C", ...commonProps },
        { x: centerX + radius, y: centerY - k, type: "C2", ...commonProps },
        { x: centerX + radius, y: centerY, type: "F", ...commonProps },

        { x: centerX + radius, y: centerY + k, type: "C", ...commonProps },
        { x: centerX + k, y: centerY + radius, type: "C2", ...commonProps },
        { x: centerX, y: centerY + radius, type: "F", ...commonProps },

        { x: centerX - k, y: centerY + radius, type: "C", ...commonProps },
        { x: centerX - radius, y: centerY + k, type: "C2", ...commonProps },
        { x: centerX - radius, y: centerY, type: "F", ...commonProps },

        { x: centerX - radius, y: centerY - k, type: "C", ...commonProps },
        { x: centerX - k, y: centerY - radius, type: "C2", ...commonProps },
        { x: centerX, y: centerY - radius, type: "F", ...commonProps },
      ];

      points[0].Z = true;

      /*
 M 0,${-radius}
    C ${k},${-radius} ${radius},${-k} ${radius},0   -- 
    C ${radius},${k} ${k},${radius} 0,${radius}   --
    C ${-k},${radius} ${-radius},${k} ${-radius},0  ---
    C ${-radius},${-k} ${-k},${-radius} 0,${-radius}

*/

      break;
    case "square_beziers": {
      const radius = Math.min(width, height) / 2; // Rayon du triangle (demi-longueur)
      const angleOffset = -Math.PI / 4; // Rotation initiale pour que le triangle pointe vers le haut

      // Calcul des sommets du triangle équilatéral
      for (let i = 0; i < 5; i++) {
        const angle = (i * (2 * Math.PI)) / 4 + angleOffset;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i > 0) {
          var j = points.length - 1;
          points.push(
            percPoint({ x, y, type: "C", ...commonProps }, points[j], 0.25)
          );
          points.push(
            percPoint(
              { x: points[j].x, y: points[j].y, type: "C2", ...commonProps },
              { x, y, type: "C", ...commonProps },
              0.25
            )
          );
        }

        points.push({ x, y, type: i === 0 ? "M" : "F", ...commonProps });
      }

      /*
    M 395.148,90.9102
    C 395.148,104.475 383.71,115.684 370.435,115.684
    C 357.16,115.684 345.722,104.475 345.722,90.9102

    Z
      
      */
      points[0].Z = true;

      break;
    }
    case "triangle_beziers": {
      const radius = Math.min(width, height) / 2; // Rayon du triangle (demi-longueur)
      const angleOffset = -Math.PI / 2; // Rotation initiale pour que le triangle pointe vers le haut

      // Calcul des sommets du triangle équilatéral
      for (let i = 0; i < 4; i++) {
        const angle = (i * (2 * Math.PI)) / 3 + angleOffset;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        if (i > 0) {
          var j = points.length - 1;
          points.push(
            percPoint({ x, y, type: "C", ...commonProps }, points[j], 0.25)
          );
          points.push(
            percPoint(
              { x: points[j].x, y: points[j].y, type: "C2", ...commonProps },
              { x, y, type: "C", ...commonProps },
              0.25
            )
          );
        }

        points.push({ x, y, type: i === 0 ? "M" : "F", ...commonProps });
      }

      /*
    M 395.148,90.9102
    C 395.148,104.475 383.71,115.684 370.435,115.684
    C 357.16,115.684 345.722,104.475 345.722,90.9102

    Z
      
      */
      points[0].Z = true;

      break;
    }
    default:
  }
  return points;
};

export const downloadFile = (content, fileName, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const isPointInPath = (canvas, path, point) => {
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);

  if (path[0].type === "bezier" && path.length >= 4) {
    ctx.bezierCurveTo(
      path[1].x,
      path[1].y,
      path[2].x,
      path[2].y,
      path[3].x,
      path[3].y
    );
  } else {
    path.forEach((p, i) => {
      if (i > 0) ctx.lineTo(p.x, p.y);
    });
  }

  return (
    ctx.isPointInPath(point.x, point.y) || ctx.isPointInStroke(point.x, point.y)
  );
};

export const getPathBounds = (path) => {
  const bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  path.forEach((point) => {
    bounds.minX = Math.min(bounds.minX, point.x);
    bounds.minY = Math.min(bounds.minY, point.y);
    bounds.maxX = Math.max(bounds.maxX, point.x);
    bounds.maxY = Math.max(bounds.maxY, point.y);
  });

  return bounds;
};

export const getScaledPath = (path, scale, center) => {
  return path.map((point) => ({
    ...point,
    x: center.x + (point.x - center.x) * scale.x,
    y: center.y + (point.y - center.y) * scale.y,
  }));
};

export const getTranslatedPath = (path, dx, dy) => {
  return path.map((point) => ({
    ...point,
    x: point.x + dx,
    y: point.y + dy,
  }));
};

export const getRotatedPath = (path, angle, center) => {
  return path.map((point) => {
    const x = point.x - center.x;
    const y = point.y - center.y;
    return {
      ...point,
      x: center.x + x * Math.cos(angle) - y * Math.sin(angle),
      y: center.y + x * Math.sin(angle) + y * Math.cos(angle),
    };
  });
};

export const getFlippedPath = (path, direction, center) => {
  return path.map((point) => ({
    ...point,
    x: direction === "horizontal" ? center.x * 2 - point.x : point.x,
    y: direction === "vertical" ? center.y * 2 - point.y : point.y,
  }));
};

export const findNearestPoint = (paths, pos, threshold = 10) => {
  let nearest = null;
  let minDistance = threshold;

  paths.forEach((path) => {
    path.forEach((point) => {
      const distance = Math.sqrt(
        Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = point;
      }
    });
  });

  return nearest;
};

export const findResizeHandle = (path, pos) => {
  const bounds = getPathBounds(path);
  const padding = 10;
  const handleSize = 8;

  const handles = [
    { x: bounds.minX - padding, y: bounds.minY - padding, id: "tl" },
    { x: bounds.maxX + padding, y: bounds.minY - padding, id: "tr" },
    { x: bounds.maxX + padding, y: bounds.maxY + padding, id: "br" },
    { x: bounds.minX - padding, y: bounds.maxY + padding, id: "bl" },
  ];

  for (const handle of handles) {
    if (
      pos.x >= handle.x - handleSize / 2 &&
      pos.x <= handle.x + handleSize / 2 &&
      pos.y >= handle.y - handleSize / 2 &&
      pos.y <= handle.y + handleSize / 2
    ) {
      return handle;
    }
  }

  return null;
};
