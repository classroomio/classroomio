export interface JsxObject {
  on(event: string, handler: (event: Event) => void): void;
  setAttribute(attributes: Record<string, unknown>): void;
}

export interface JsxPoint extends JsxObject {
  X(): number;
  Y(): number;
  moveTo(coordinates: [number, number]): void;
}

export interface JsxBoard {
  create(type: string, parents: unknown[], attributes?: Record<string, unknown>): JsxObject;
  removeObject(object: JsxObject): void;
  on(event: string, handler: (event: Event) => void): void;
  getAllObjectsUnderMouse(event: Event): JsxObject[];
  getMousePosition(event: Event): [number, number];
  resizeContainer(width: number, height: number, dontSetContainer?: boolean, dontSetBoundingBox?: boolean): void;
  setBoundingBox(boundingBox: [number, number, number, number], keepAspectRatio?: boolean): void;
  suspendUpdate(): void;
  unsuspendUpdate(): void;
  update(): void;
}

export interface JsxCoords {
  usrCoords: [number, number, number];
}

export interface JsxGraphApi {
  COORDS_BY_SCREEN: number;
  Coords: new (method: number, coordinates: [number, number], board: JsxBoard) => JsxCoords;
  JSXGraph: {
    initBoard(container: HTMLElement, attributes: Record<string, unknown>): JsxBoard;
    freeBoard(board: JsxBoard): void;
  };
}
