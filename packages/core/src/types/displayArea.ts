type InitialDisplayArea = {
  areaX: number;
  areaY: number;
};

type ImageFocalPoint = {
  focalX: number;
  focalY: number;
};

type DisplayArea = {
  imageArea: InitialDisplayArea;
  imageFocalPoint: ImageFocalPoint;
};

export default DisplayArea;
