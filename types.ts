
export enum ComponentType {
  DFrame = 'DFrame',
  DButton = 'DButton',
  DLabel = 'DLabel',
  DTextEntry = 'DTextEntry',
  DPanel = 'DPanel',
  DCheckBox = 'DCheckBox',
  DComboBox = 'DComboBox',
  DListView = 'DListView',
  DPropertySheet = 'DPropertySheet',
  DScrollPanel = 'DScrollPanel',
  DImage = 'DImage',
  DColorMixer = 'DColorMixer',
  DSlider = 'DSlider',
  DNumSlider = 'DNumSlider',
  DCollapsibleCategory = 'DCollapsibleCategory',
  DTree = 'DTree',
  DColumnSheet = 'DColumnSheet',
  DIconLayout = 'DIconLayout',
  DGrid = 'DGrid',
  DMenu = 'DMenu',
  DMenuBar = 'DMenuBar',
  DHTML = 'DHTML',
  DBinder = 'DBinder',
  DColorCube = 'DColorCube',
  DColorPalette = 'DColorPalette',
  DForm = 'DForm',
  DImageButton = 'DImageButton',
  DModelPanel = 'DModelPanel',
  DNotify = 'DNotify',
  DProgress = 'DProgress',
  DRichText = 'DRichText',
  DSysButton = 'DSysButton',
  DTooltip = 'DTooltip',
  DVerticalDivider = 'DVerticalDivider',
  DNumberWang = 'DNumberWang',
  DBevel = 'DBevel',
  DTab = 'DTab'
}

export interface ComponentProps {
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  color?: string; // Hex string
  checked?: boolean;
  variableName: string;
  
  // Appearance
  tooltip?: string;
  textAlign?: 'left' | 'center' | 'right';
  hoverColor?: string; // Hex string
  borderColor?: string; // Hex string
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number; // 0-255

  // Enhanced Hover
  hoverOpacity?: number; // 0-255
  hoverBorderColor?: string;

  // Text Shadow
  textShadow?: boolean;
  textShadowColor?: string;
  textShadowOffset?: number;

  // Layout
  layoutMode?: 'none' | 'vertical' | 'horizontal';
  layoutSpacing?: number;
  layoutPadding?: number;

  // Effects
  hoverScale?: number; // Multiplier, e.g. 1.1

  // Image
  imageUrl?: string;
  imageColor?: string; // Tint color

  // Font
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;

  // Model Panel
  modelPath?: string;
  modelFov?: number;

  // DFrame Specifics
  titleBarColor?: string;
  draggable?: boolean;
  sizable?: boolean;
  showCloseButton?: boolean;
  deleteOnClose?: boolean;

  // Logic
  methods?: Record<string, string>; // methodName -> code body
}

export interface UIElement {
  id: string;
  type: ComponentType;
  props: ComponentProps;
  parentId: string | null;
  children: string[];
}

export interface EditorState {
  elements: Record<string, UIElement>;
  rootId: string | null;
  selectedId: string | null;
  canvasWidth: number;
  canvasHeight: number;
}

export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;
  showGrid: boolean;
}
