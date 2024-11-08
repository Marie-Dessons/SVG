import React, { useState, useRef, useEffect, useMemo } from "react";
import Canvas from "./Canvas";
import DrawingControls from "./DrawingControls";
import {
  getMousePos,
  drawPath,
  drawSelectionBox,
  drawPreview,
  createShape,
  downloadFile,
  isPointInPath,
  getScaledPath,
  getTranslatedPath,
  getRotatedPath,
  getFlippedPath,
  getPathBounds,
  drawControlPoints,
  findControlPoint,
  updatePathPoint,
  drawGrid,
} from "../utils/drawingUtils";

const DrawingSVG = ({ width = 512, height = 512, className = "" }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [versions, setVersions] = useState([{ paths: [], name: "Version 1" }]);
  const [selectedVersion, setSelectedVersion] = useState(0);
  //const [paths, setPaths] = useState([]);
  const paths = useMemo(() => versions[selectedVersion].paths, [versions, selectedVersion]);
  const setPaths = (newPaths) => {
    if (typeof newPaths === "function") {
      newPaths = newPaths(paths);
    }
    setVersions((prev) => {
      const newVersions = [...prev];
      newVersions[selectedVersion] = { paths: newPaths, name: prev[selectedVersion].name };
      return newVersions;
    });
  };
  const [currentPath, setCurrentPath] = useState([]);
  const [svgString, setSvgString] = useState("");
  const [selectedPathIndex, setSelectedPathIndex] = useState(null);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [selectedShape, setSelectedShape] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [fillEnabled, setFillEnabled] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [initialMousePos, setInitialMousePos] = useState({ x: 0, y: 0 });
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialScale, setInitialScale] = useState({ x: 1, y: 1 });
  const [isEditMode, setIsEditMode] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [selectedColor, setSelectedColor] = useState("black");
  const [isColoredSVG, setIsColoredSVG] = useState(true);
  const [borderRadius, setBorderRadius] = useState(0);
  const [gridSize, setGridSize] = useState(0);
  const [isEditingPoint, setIsEditingPoint] = useState(false);
  
  const [realSelectedPoint, setRealSelectedPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [clickedPoint, setClickedPoint] = useState(null);

var futurePaths
var transitionPaths
var nPath

function easeInOutWithBounce(t) {

  var tressort = 0.9
  const amplitude =0.05
  const tp = 0.4
  if (t < tressort) {
    // Utilise une courbe d'ease-in-out classique jusqu'à 90% de la transition
    return (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)/tressort;
  } else {
    // Applique un effet de rebond pour les 10% restants de la transition


var xt = Math.pow((t-tressort)/0.1,tp)

    return 1 + amplitude * xt*(1-xt)/0.25; // Rebond de faible amplitude
  }
}
function easeInOutWithStrongBounce(t) {
  if (t < 0.85) {
    // Utilise une courbe d'ease-in-out classique jusqu'à 85% de la transition
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  } else {
    // Applique un effet de rebond amplifié pour les 15% restants de la transition
    const bounceT = (t - 0.85) / 0.15; // Normalise t pour la portion de rebond
    return 1 - (1 - easeOutBounce(bounceT)) * 0.2; // Rebond de plus grande amplitude
  }
}
function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}
const f=(t)=>
{

return easeInOutWithBounce (t)

}

const transitionVersion = (index, t0=0) => {
  // Définir les fonctions d'interpolation de couleur en premier
  const colorToRGB = (color) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color;
    return ctx.fillStyle;
  };

  const interpolateColor = (color1, color2, t) => {
    const rgb1 = colorToRGB(color1);
    const rgb2 = colorToRGB(color2);
    
    const r1 = parseInt(rgb1.slice(1, 3), 16);
    const g1 = parseInt(rgb1.slice(3, 5), 16);
    const b1 = parseInt(rgb1.slice(5, 7), 16);
    
    const r2 = parseInt(rgb2.slice(1, 3), 16);
    const g2 = parseInt(rgb2.slice(3, 5), 16);
    const b2 = parseInt(rgb2.slice(5, 7), 16);
    
    const r = Math.round(r1 * (1 - t) + r2 * t);
    const g = Math.round(g1 * (1 - t) + g2 * t);
    const b = Math.round(b1 * (1 - t) + b2 * t);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  var step=0.01
  if(t0>=1) {
    futurePaths= null
    transitionPaths=null
    setSelectedVersion(index)
  } else {

    if(!futurePaths) {
      futurePaths = versions[index].paths
      nPath = Math.max(paths.length, futurePaths.length) 
      var invPath = paths.length <= futurePaths.length ? -1:1
      var tPaths = paths.length > futurePaths.length ? paths : futurePaths
      var oPaths = paths.length <= futurePaths.length ? paths : futurePaths
      transitionPaths =
        tPaths.map((path,i)=> {
          var oPath = oPaths[Math.min(i, oPaths.length-1)]
          var refPath = path.length > oPath.length ? path : oPath
          var offPath = path.length <= oPath.length ? path : oPath
          var invPoint = path.length <= oPath.length ? -1 : 1
    
          // Correction ici : toujours prendre la couleur source des paths actuels
          // et la couleur destination des futurePaths
          const sourceColor = paths[Math.min(i, paths.length-1)][0]?.color || "black"
          const targetColor = futurePaths[Math.min(i, futurePaths.length-1)][0]?.color || "black"
    
          return refPath.map((point,j)=> {  
            var oPoint = offPath[Math.min(j, offPath.length-1)]
            return {
              ...point,
              point0: invPath*invPoint === 1 ? point : oPoint,
              point1: invPath*invPoint === 1 ? oPoint : point,
              color0: sourceColor,
              color1: targetColor
            }
          })
        })
    } 
    
    var tx = f(t0)
    transitionPaths = transitionPaths.map(path => {  
      // Interpoler la couleur pour ce chemin
      const currentColor = interpolateColor(path[0].color0, path[0].color1, tx)
      
      return path.map((point, i) => ({
        ...point,
        x: point.point0.x*(1-tx) + point.point1.x*tx,
        y: point.point0.y*(1-tx) + point.point1.y*tx,
        color: currentColor // Ajouter la couleur interpolée
      }))
    })

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = selectedColor;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gridSize > 0) {
      drawGrid(ctx, gridSize, canvas.width, canvas.height);
    }

    transitionPaths.forEach((path) => {
      ctx.strokeStyle = path[0].color // Utiliser la couleur interpolée
      drawPath(ctx, path)
    })

    var duration = 0.9
    setTimeout(() => transitionVersion(index, t0 + 20.0/(1000.0*duration)), 10)
  }
}


  const addPoint = (point, pos, pathIndex) => { 
    var path = paths[pathIndex];
   
var adds = []
    if (point.toAdd) adds= point.toAdd;
    else adds.push(point);
    path = [
      ...path.filter((_, i) => i <= point.middle[1]),
      ...adds,
      ...path.filter((_, i) => i > point.middle[1]),
    ];

    setPaths((prev) => prev.map((p, i) => (i === pathIndex ? path : p)));

    return point;
  };

  const delPoint = (point) => {
    point = point ?? clickedPoint
    if (point != null) {

      const updatedPaths = [...paths];
if(point.index ===updatedPaths[  point.selectedPathIndex].length-1) point.index =0
      updatedPaths[point.selectedPathIndex] = updatedPaths[
        point.selectedPathIndex
      ].filter((_, i) => {
        
        if(point.index ===0  ){
             return  i!==0  && point.index !==updatedPaths[  point.selectedPathIndex ].length-1  && i!==1 && 
             point.index !==updatedPaths[  point.selectedPathIndex ].length-2
        }
        else
      {
            return  i!== point.index &&  i!== point.index+1 &&  i!== point.index -1 
      }});
   

      if (point.index === 0){
       var C2 =  updatedPaths[point.selectedPathIndex].shift()
       updatedPaths[point.selectedPathIndex].push(C2)
       updatedPaths[point.selectedPathIndex].push({ ...updatedPaths[point.selectedPathIndex],type:"F"})
  
      }
      setPaths(updatedPaths);
      setIsEditingPoint();
      setRealSelectedPoint()
      setSelectedPoint();
      setClickedPoint();
      return;
    }
  };
  const updatePoint = (point,selectedPathIndex,index) => {
 
    if (point != null) {

      const updatedPaths = [...paths];

      updatedPaths[selectedPathIndex] = updatedPaths[
        selectedPathIndex
      ].map((pt, i) => {
        
        if(index ===i  ){
             return point
        }
        else
      {
            return  pt
      }});
   

 
      setPaths(updatedPaths);
    
      return;
    }
  };
  
  const startDrawing = (e) => {
    const pos = getMousePos(canvasRef.current, e);
    setInitialMousePos(pos);
  
    if (selectedPathIndex !== null && isEditMode) {
      const path = paths[selectedPathIndex];
      const bounds = getPathBounds(path);
      const handleSize = 8;

       // Vérifier si on clique sur le bouton de rotation
    const rotationButtonInfo = drawSelectionBox(canvasRef.current.getContext('2d'), path).rotationButton;
    const distanceToRotationButton = Math.sqrt(
      Math.pow(pos.x - rotationButtonInfo.x, 2) + 
      Math.pow(pos.y - rotationButtonInfo.y, 2)
    );

    if (distanceToRotationButton <= rotationButtonInfo.radius) {
      setIsRotating(true);
      setInitialRotation(0);
      return;
    }
  
      // Vérifier si on clique sur une poignée de redimensionnement
      const handles = [
        { id: "tl", x: bounds.minX, y: bounds.minY },
        { id: "tr", x: bounds.maxX, y: bounds.minY },
        { id: "bl", x: bounds.minX, y: bounds.maxY },
        { id: "br", x: bounds.maxX, y: bounds.maxY }
      ];
  
      const clickedHandle = handles.find(handle => 
        Math.abs(handle.x - pos.x) < handleSize &&
        Math.abs(handle.y - pos.y) < handleSize
      );
  
      if (clickedHandle) {
        setIsResizing(true);
        setResizeHandle(clickedHandle);
        return;
      }
      const controlPoint = findControlPoint(path, pos);

      if (controlPoint) {
        if (controlPoint.type === "middle") {
          addPoint(controlPoint, controlPoint.middle[0], selectedPathIndex);

          return;
        }
        setIsEditingPoint(true);
        setSelectedPoint(controlPoint);
        if( controlPoint.type==="M" || controlPoint.type==="F" )   setRealSelectedPoint(controlPoint)
        setClickedPoint({ ...controlPoint, selectedPathIndex });
        return;
      }

      if (isPointInPath(canvasRef.current, path, pos)) {
        setIsMoving(true);
        return;
      }
    }

    if (isEditMode) {
      const clickedPathIndex = paths.findIndex((path) =>
        isPointInPath(canvasRef.current, path, pos)
      );

      if (clickedPathIndex !== -1) {
        setSelectedPathIndex(clickedPathIndex);
        setIsMoving(true);
        return;
      }
      setSelectedPathIndex(null);
      setRealSelectedPoint(null);
      setSelectedPoint()
    }

    if (selectedShape) {
      setIsDrawing(true);
      setStartPoint(pos);
      return;
    }
  };

// changer la couleur du path
  const changePathColor = (color) => {
    setSelectedColor(color)
    if (selectedPathIndex !== null) {
      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = updatedPaths[selectedPathIndex].map(point => ({
        ...point,
        color,
      }));
      setPaths(updatedPaths);
    }
  };

  
  //changer le fill du path
  const changePathFill = (fill) => {
    setFillEnabled(fill)
    if (selectedPathIndex !== null) {
      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = updatedPaths[selectedPathIndex].map(point => ({
        ...point,
        fill,
      }));
      setPaths(updatedPaths);
    }
  };

  //changer épaisseur du path
  const changePathStrokeWidth = (width) => {
    setStrokeWidth(width); 
    if (selectedPathIndex !== null) {
      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = updatedPaths[selectedPathIndex].map(point => ({
        ...point,
        width, 
      }));
      setPaths(updatedPaths);
    }
  };

// Fonction pour déplacer le chemin sélectionné en avant
  const movePathToFront = () => {
    if (selectedPathIndex === null) return;
    const newPaths = [...paths];
    const [path] = newPaths.splice(selectedPathIndex, 1);
    newPaths.push(path);
    setPaths(newPaths);
    setSelectedPathIndex(newPaths.length - 1);
  };

// Fonction pour déplacer le chemin sélectionné en arrière
  const movePathToBack = () => {
    if (selectedPathIndex === null) return;
    const newPaths = [...paths];
    const [path] = newPaths.splice(selectedPathIndex, 1);
    newPaths.unshift(path);
    setPaths(newPaths);
    setSelectedPathIndex(0);
  };

  const draw = (e) => {
    const pos = getMousePos(canvasRef.current, e);
    let drawPos = pos;
  
    if (isEditingPoint && selectedPoint) {
      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = updatePathPoint(
        paths[selectedPathIndex],
        selectedPoint.index,
        drawPos
      );
      setPaths(updatedPaths);
      return;
    }
  
    if (isMoving && selectedPathIndex !== null) {
      const dx = drawPos.x - initialMousePos.x;
      const dy = drawPos.y - initialMousePos.y;
      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = getTranslatedPath(
        paths[selectedPathIndex],
        dx,
        dy
      );
      setPaths(updatedPaths);
      setInitialMousePos(drawPos);
      return;
    }
  
    if (isResizing && selectedPathIndex !== null && resizeHandle) {
      const path = paths[selectedPathIndex];
      const bounds = getPathBounds(path);
      const dx = drawPos.x - initialMousePos.x;
      const dy = drawPos.y - initialMousePos.y;
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
  
      let scaleX = 1;
      let scaleY = 1;
  
      switch (resizeHandle.id) {
        case "br": // Bottom Right
          scaleX = (bounds.maxX - bounds.minX + dx) / (bounds.maxX - bounds.minX);
          scaleY = (bounds.maxY - bounds.minY + dy) / (bounds.maxY - bounds.minY);
          break;
        case "bl": // Bottom Left
          scaleX = (bounds.maxX - drawPos.x) / (bounds.maxX - bounds.minX);
          scaleY = (bounds.maxY - bounds.minY + dy) / (bounds.maxY - bounds.minY);
          break;
        case "tr": // Top Right
          scaleX = (bounds.maxX - bounds.minX + dx) / (bounds.maxX - bounds.minX);
          scaleY = (bounds.maxY - drawPos.y) / (bounds.maxY - bounds.minY);
          break;
        case "tl": // Top Left
          scaleX = (bounds.maxX - drawPos.x) / (bounds.maxX - bounds.minX);
          scaleY = (bounds.maxY - drawPos.y) / (bounds.maxY - bounds.minY);
          break;
      }
  
      // Éviter les valeurs négatives ou nulles
      scaleX = Math.max(0.1, scaleX);
      scaleY = Math.max(0.1, scaleY);
  
      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = getScaledPath(
        path,
        { x: scaleX, y: scaleY },
        { x: centerX, y: centerY }
      );
      setPaths(updatedPaths);
      setInitialMousePos(drawPos);
      return;
    }

    const startResize = (handle, e) => {  // Ajout du paramètre e
      if (selectedPathIndex !== null) {
        setIsResizing(true);
        setResizeHandle(handle);
        setInitialMousePos(getMousePos(canvasRef.current, e));  // Utilisation de e au lieu de event
      }
    };

    if (isRotating && selectedPathIndex !== null) {
      const path = paths[selectedPathIndex];
      const bounds = getPathBounds(path);
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
  
      const angle = (
        Math.atan2(pos.y - centerY, pos.x - centerX) -
        Math.atan2(initialMousePos.y - centerY, initialMousePos.x - centerX)
      ) * 0.3; // Rotation plus lente
  
      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = getRotatedPath(
        paths[selectedPathIndex],
        angle - initialRotation,
        { x: centerX, y: centerY }
      );
      setPaths(updatedPaths);
      setInitialRotation(angle);
      return;
    }

    if (!isDrawing) return;

    else if (selectedShape && startPoint) {
      const shapePoints = createShape(
        startPoint,
        drawPos,
        selectedShape,
        strokeWidth,
        fillEnabled,
        selectedColor,
        borderRadius
      );
      setCurrentPath(shapePoints);
    }
  };

  const endDrawing = () => {
    if (isMoving || isResizing || isRotating || isEditingPoint) {
      setIsMoving(false);
      setIsResizing(false);
      setIsRotating(false);
      setIsEditingPoint(false);
     // setSelectedPoint(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      setPaths((prev) => [...prev, currentPath]);
    }
    setCurrentPath([]);
    setStartPoint(null);
  };

  const startRotating = () => {
    if (selectedPathIndex !== null) {
      setIsRotating(true);
      setInitialRotation(0);
    }
  };

  const flipHorizontally = () => {
    if (selectedPathIndex !== null) {
      const path = paths[selectedPathIndex];
      const bounds = getPathBounds(path);
      const centerX = (bounds.minX + bounds.maxX) / 2;

      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = getFlippedPath(path, "horizontal", {
        x: centerX,
        y: 0,
      });
      setPaths(updatedPaths);
    }
  };

  const flipVertically = () => {
    if (selectedPathIndex !== null) {
      const path = paths[selectedPathIndex];
      const bounds = getPathBounds(path);
      const centerY = (bounds.minY + bounds.maxY) / 2;

      const updatedPaths = [...paths];
      updatedPaths[selectedPathIndex] = getFlippedPath(path, "vertical", {
        x: 0,
        y: centerY,
      });
      setPaths(updatedPaths);
    }
  };

  const clearCanvas = () => {
    setPaths([]);
    setCurrentPath([]);
    setSelectedPathIndex(null);
    setSvgString("");
  };

  const deletePath = () => {
    if (selectedPathIndex !== null) {
   
      const newPaths = paths.filter((_, index) => index !== selectedPathIndex);
      setPaths(newPaths);
      setSelectedPathIndex(null);
    }
  };

  const duplicatePath = () => {
    if (selectedPathIndex !== null) {
      const duplicatedPath = paths[selectedPathIndex].map(point => ({ ...point }));
            setPaths(prevPaths => [...prevPaths, duplicatedPath]);
    }
  };
  

  const generateSVG = () => {
versions.forEach((version, versionIndex) => {
      
      var paths = version.paths.map((path) => {
        const d = path.reduce((acc, point, index) => {
          if(acc!=="") acc+=" "
          if(point.type==="M")  acc+= "M " + point.x + "," + point.y 
          
          if(point.type==="C" )  acc+= "C " + point.x + "," + point.y 

          if(point.type==="C2" || point.type==="F" )  acc+=  point.x + "," + point.y 

          return acc
          ;
        }, "");


        const color = isColoredSVG ? path[0].color || "black" : "black";
        return `<path 
          d="${d}" 
          fill="${path[0].fill ? color : "none"}" 
          stroke="${color}" 
          stroke-width="${path[0].width}"
          stroke-linecap="round"
          stroke-linejoin="round"
          rx="${path[0].borderRadius || 0}"
          ry="${path[0].borderRadius || 0}"
       
        >
        </path>`;
      }).join("\n        ");
    
      const svgContent = `
      <svg 
        viewBox="0 0 ${width} ${height}" 
        xmlns="http://www.w3.org/2000/svg"
        style="stroke-linecap: round; stroke-linejoin: round;"
      >
        ${paths}
      </svg>
    `;

    setSvgString(svgContent);
    downloadFile(svgContent, version.name+"_" + versionIndex + ".svg", "image/svg+xml");
    

    });


  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = selectedColor;

    const redraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (gridSize > 0) {
        drawGrid(ctx, gridSize, canvas.width, canvas.height);
      }

      paths.forEach((path, index) => {
        ctx.strokeStyle = path[0].color || "black";
        drawPath(ctx, path);
        if (index === selectedPathIndex) {
          drawSelectionBox(ctx, path);
          drawControlPoints(ctx, path, realSelectedPoint );
          if (showPreview) {
            drawPreview(ctx, path);
          }
        }
      });

      if (currentPath.length > 0) {
        ctx.strokeStyle = selectedColor;
        drawPath(ctx, currentPath);
        if (showPreview) {
          drawPreview(ctx, currentPath);
        }
      }
    };

    redraw();
  }, [
    paths,
    currentPath,
    selectedPathIndex,
    showPreview,
    selectedColor,
    realSelectedPoint,

    gridSize,
    strokeWidth,
  ]);

  const startResize = (handle) => {
    if (selectedPathIndex !== null) {
      setIsResizing(true);
      setResizeHandle(handle);
      setInitialMousePos(getMousePos(canvasRef.current));
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-5 gap-6 ${className}`}>
           <div className="bg-white rounded-xl shadow-lg p-6 text-xs">
            Paths 
          { paths.map((path,i)=><div key={i} className={"w-full flex flex-col gap-1 p-1 rounded-l " + ( i===selectedPathIndex ? " bg-blue-100" :"")}>
            <div key={i} className={ "p-2 border w-full justify-between flex" }   >
          <div key={i} className={ "p-2 " + ( i===selectedPathIndex ? " bg-blue-100" :"")}  
          onClick={ ()=> setSelectedPathIndex(i)}
          
          > Path {i}    </div>
          <button
          onClick={deletePath}
          disabled={selectedPathIndex !== i}
          className={`p-1 rounded-lg transition-colors duration-200 flex items-center gap-1 shadow-md
            ${
              selectedPathIndex === i
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
    
        </button>
        <button onClick={duplicatePath} title="Dupliquer" className="duplicate-button p-1 rounded-lg shadow-md mx-1 bg-gray-50
        ">
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M16 1H8a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V4a3 3 0 0 0-3-3zM8 2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm13 5v12a4 4 0 0 1-4 4H7v1a1 1 0 0 0 1 1h10a5 5 0 0 0 5-5V8a1 1 0 0 0-1-1h-1z"/>
  </svg>
</button>
</div>
        
        {  selectedPathIndex === i &&  path.map( (point,j)=>
        <div key={j}  className={"flex flex-col w-full "   + ( j<path.length-1 &&(point.type==="M" ||  point.type==="F") ?"":" hidden "  )  + (realSelectedPoint?.index===j ? "bg-gray-200":"" )}> 
   <div key={j} className={"flex border-b flex-row w-full justify-between text-xs "  }> <div  onClick={(()=>setRealSelectedPoint( {...point,index:j } ))}  >     { point.type}  ({Math.round(point.x) },{Math.round(point.y)}) </div>    
        
       { 
       selectedPathIndex === i &&  realSelectedPoint?.index===j   &&
        <button
          onClick={()=>delPoint({...point,index:j,  selectedPathIndex})}
  
          className={`p-1 rounded-lg transition-colors duration-200 flex items-center gap-2 
       
             text-red-700
              
            `}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
    
        </button>
}
        
        </div>
        { 
       selectedPathIndex === i &&  realSelectedPoint?.index===j   &&  
       <div className="flex w-full p-1">
       <input
            type="checkbox"
            checked={point.solidaire}
            onChange={(e) => updatePoint({...point,solidaire : !point.solidaire    },selectedPathIndex,j)    }
            className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Solidaire</span>
          </div>
        }
        
         </div> )}
        
        </div>

          )}
      </div>
      <div className="md:col-span-3">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded-lg transition-colors duration-200
                ${
                  isEditMode
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {isEditMode ? "Quitter mode édition" : "Mode édition"}
            </button>
            {selectedPathIndex !== null && isEditMode && (
              <>
              <div className="flex flex-col gap-1">
          <button
            onClick={movePathToFront}
            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            title="Move to Front"
          >
            Up
          </button>
          <button
            onClick={movePathToBack}
            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            title="Move to Back"
          >
            Down
          </button>
        </div>
                <button
                  onClick={flipHorizontally}
                  className="p-2 bg-blue-800 text-white rounded-lg"
                >
                  Flip H
                </button>
                <button
                  onClick={flipVertically}
                  className="p-2 bg-blue-800 text-white rounded-lg"
                >
                  Flip V
                </button>
              </>
            )}
          </div>
          <div className="relative aspect-square">
            <Canvas
              ref={canvasRef}
              width={width}
              height={height}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mt-6">
<div className=" flex gap-1 w-full bg-white rounded-lg shadow p-4">
  {versions.map((version, index) => (<div className={"border p-2  " + (index === selectedVersion ? "bg-blue-100" : "")} 
  onClick={
    () => transitionVersion(index)
  }>
  {version.name}</div>))}
  <button className="border rounded-md bg-gray-100 p-2" 
  onClick={ () => { 
    var name = prompt("Nom de la version", "Version " + (versions.length + 1));
    setVersions([...versions, { paths: JSON.parse(JSON.stringify(paths)), name: name }]);
    setSelectedVersion(versions.length);

  }}> Ajouter version</button>
     
  </div>   
  
  <div className=" flex gap-1 w-full bg-white rounded-lg shadow p-4">
  <button className=" border rounded-md bg-gray-100 p-2" 
  onClick={ () => { 
    localStorage.setItem("versions", JSON.stringify(versions));
  }}> Save All</button>

  <button className=" border rounded-md bg-gray-100 p-2" 
  onClick={ () => { 
    
    var versions = JSON.parse(localStorage.getItem("versions"));
    if (versions) {
      setVersions(versions);
      setSelectedVersion(0);
    }
  }}> Restore All</button>

<button className=" border rounded-md bg-gray-100 p-2" 
  onClick={ () => { 
      localStorage.removeItem("versions");
  }}> Reset All</button>
     
  </div>
       <div className="flex items-center gap-2">
            <button
              onClick={generateSVG}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 shadow-md">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Télécharger SVG
            </button>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isColoredSVG}
                onChange={(e) => setIsColoredSVG(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"/>
              <span className="text-sm text-gray-700">Couleurs</span>
            </label>
          </div>

          <button
            onClick={clearCanvas}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 shadow-md">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Tout effacer
          </button>

          
        </div>
      </div>

      <div className="md:col-span-1">
        <DrawingControls
          strokeWidth={strokeWidth}
          onStrokeWidthChange={changePathStrokeWidth}
          onShapeSelect={setSelectedShape}
          selectedShape={selectedShape}
          fillEnabled={fillEnabled}
          onFillChange={changePathFill}
          showPreview={showPreview}
          onPreviewChange={setShowPreview}
          selectedColor={selectedColor}
          onColorChange={changePathColor}
          borderRadius={borderRadius}
          onBorderRadiusChange={setBorderRadius}
          gridSize={gridSize}
          onGridSizeChange={setGridSize}
          onDeletePoint={clickedPoint ? delPoint : null}/>
      </div>

      {svgString && (
        <div className="md:col-span-4 bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            SVG Output:
          </h2>
          <pre className="bg-white p-4 rounded border border-gray-200 overflow-x-auto text-sm">
            {svgString}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DrawingSVG;
