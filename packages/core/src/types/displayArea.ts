type InitialDisplayArea = {
  areaX: number;
  areaY: number;
};

type ImagePoint = {
  imageX: number;
  imageY: number;
};

type CanvasPoint = {
  canvasX: number;
  canvasY: number;
};

type DisplayArea = {
  imageArea: InitialDisplayArea;
  imageCanvasPoint: {
    imagePoint: ImagePoint;
    canvasPoint: CanvasPoint;
  };
  storeAsInitialCamera: boolean;
};

export default DisplayArea;
