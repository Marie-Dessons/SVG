import React, { useState } from "react";

const STROKE_WIDTHS = [6, 8, 16, 32, 64, 128];
const SHAPES = [
  { id: "circle_beziers", label: "Cercle", path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" },
  { id: "square_beziers", label: "Carré", path: "M4 4h16v16H4z" },
  { id: "triangle_beziers", label: "Triangle", path: "M12 3l8 16H4z" },
];
const BORDER_RADIUS = [0, 4, 8, 16, 24, 32];
const GRID_SIZES = [0, 8, 16, 32, 64, 128];

const DrawingControls = ({
  strokeWidth,
  onStrokeWidthChange,
  onShapeSelect,
  selectedShape,
  fillEnabled,
  onFillChange,
  showPreview,
  onPreviewChange,
  selectedColor,
  onColorChange,
  borderRadius,
  onBorderRadiusChange,
  gridSize,
  onGridSizeChange,
  usedColors = [],
}) => {
  const [recentColors, setRecentColors] = useState([]);

  const handleColorChange = (e) => {
    const color = e.target.value;
    onColorChange(color);
    setRecentColors((prevColors) => {
      const newColors = prevColors.includes(color)
        ? prevColors
        : [color, ...prevColors].slice(0, 16);
      return newColors;
    });
  };

  const handleHexInputChange = (e) => {
    const value = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onColorChange(value);
      setRecentColors((prevColors) => {
        const newColors = prevColors.includes(value)
          ? prevColors
          : [value, ...prevColors].slice(0, 10);
        return newColors;
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 bg-white rounded-xl shadow-lg">
      <div>
        <h3 className="text-sm font-semibold text-gray-700">Formes</h3>
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={fillEnabled}
            onChange={(e) => onFillChange(e.target.checked)}
            className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Remplir les formes</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SHAPES.map((shape) => (
            <button
              key={shape.id}
              //const selectedShape = {SHAPES[2]}
              onClick={() => onShapeSelect(shape)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedShape?.id === shape.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-200"
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-full h-8"
                fill={fillEnabled ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d={shape.path} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Couleurs</h3>
        <div className="flex flex-col gap-2">
          <input
            type="color"
            value={selectedColor}
            onChange={handleColorChange}
            className="w-full h-10 cursor-pointer"
          />
          <input
            type="text"
            value={selectedColor}
            onChange={handleHexInputChange}
            placeholder="#000000"
            className="w-full p-2 border rounded-md font-mono"
          />
        </div>
      </div>

      {recentColors.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Couleurs récemment utilisées
          </h4>
          <div className="flex gap-1 flex-wrap">
            {recentColors.map((color, index) => (
              <button
                key={index}
                onClick={() => onColorChange(color)}
                className="w-6 h-6 rounded-full shadow-md border"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Grille d'aide
        </h3>
        <div className="flex gap-2 items-center">
          <label htmlFor="grid-size-select"></label>
          <select
            id="grid-size-select"
            value={gridSize}
            onChange={(e) => onGridSizeChange(Number(e.target.value))}
            className="p-2 border rounded-md"
          >
            {GRID_SIZES.map((size) => (
              <option key={size} value={size}>
                {size === 0 ? "Off" : `${size}px`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Épaisseur du trait
        </h3>
        <div className="flex gap-2 items-center">
          {STROKE_WIDTHS.map((width) => (
            <button
              key={width}
              onClick={() => onStrokeWidthChange(width)}
              className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors ${
                strokeWidth === width
                  ? "ring-2 ring-blue-500"
                  : "hover:ring-2 hover:ring-blue-300"
              }`}
            >
              <div
                className="rounded-full bg-gray-800"
                style={{ width: `${width / 4}px`, height: `${width / 3}px` }}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Border Radius
        </h3>
        <div className="flex gap-2 items-center">
          <label htmlFor="border-radius-select"></label>
          <select
            id="border-radius-select"
            value={borderRadius}
            onChange={(e) => onBorderRadiusChange(Number(e.target.value))}
            className="p-2 border rounded-md"
          >
            {BORDER_RADIUS.map((radius) => (
              <option key={radius} value={radius}>
                {radius}px
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Options</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showPreview}
            onChange={(e) => onPreviewChange(e.target.checked)}
            className="w-4 h-4 text-blue-500 rounded border-gray-300 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Aperçu des dimensions</span>
        </label>
      </div>
    </div>
  );
};

export default DrawingControls;
