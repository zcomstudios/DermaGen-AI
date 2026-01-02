import { ComponentType } from "../types";

export interface MethodSignature {
  name: string;
  args: string[];
  description?: string;
}

const COMMON_PANEL_METHODS: MethodSignature[] = [
  { name: 'Paint', args: ['self', 'w', 'h'], description: 'Called when the panel is drawn.' },
  { name: 'PaintOver', args: ['self', 'w', 'h'], description: 'Called after the panel and its children are drawn.' },
  { name: 'Think', args: ['self'], description: 'Called every frame.' },
  { name: 'PerformLayout', args: ['self', 'w', 'h'], description: 'Called when the panel needs to layout its children.' },
  { name: 'Init', args: ['self'], description: 'Called when the panel is initialized.' },
  { name: 'OnRemove', args: ['self'], description: 'Called when the panel is removed.' },
  { name: 'OnCursorEntered', args: ['self'], description: 'Called when the cursor enters the panel.' },
  { name: 'OnCursorExited', args: ['self'], description: 'Called when the cursor leaves the panel.' },
  { name: 'OnMousePressed', args: ['self', 'keyCode'], description: 'Called when a mouse button is pressed.' },
  { name: 'OnMouseReleased', args: ['self', 'keyCode'], description: 'Called when a mouse button is released.' },
  { name: 'OnMouseDoubleClick', args: ['self', 'keyCode'], description: 'Called when a mouse button is double clicked.' },
  { name: 'OnDragDrop', args: ['self', 'data'], description: 'Called when a drag and drop operation finishes on this panel.' },
  { name: 'SetKeyboardInput', args: ['self', 'b'], description: 'Sets whether keyboard input is enabled.' },
  { name: 'OnDraw', args: ['self', 'w', 'h'], description: 'Custom draw function.' },
  { name: 'OnPaint', args: ['self', 'w', 'h'], description: 'Alternative paint hook.' },
];

const COMPONENT_METHODS: Partial<Record<ComponentType, MethodSignature[]>> = {
  [ComponentType.DFrame]: [
    { name: 'OnClose', args: ['self'], description: 'Called when the frame is closed.' },
    { name: 'Close', args: ['self'], description: 'Closes the frame.' },
  ],
  [ComponentType.DButton]: [
    { name: 'DoClick', args: ['self'], description: 'Called when the button is left-clicked.' },
    { name: 'DoRightClick', args: ['self'], description: 'Called when the button is right-clicked.' },
    { name: 'DoMiddleClick', args: ['self'], description: 'Called when the button is middle-clicked.' },
  ],
  [ComponentType.DTextEntry]: [
    { name: 'OnEnter', args: ['self'], description: 'Called when Enter is pressed.' },
    { name: 'OnChange', args: ['self'], description: 'Called when the text changes.' },
    { name: 'OnGetFocus', args: ['self'], description: 'Called when the element gains focus.' },
    { name: 'OnLoseFocus', args: ['self'], description: 'Called when the element loses focus.' },
    { name: 'AllowInput', args: ['self', 'char'], description: 'Return true to allow input, false to block.' },
  ],
  [ComponentType.DCheckBox]: [
    { name: 'OnChange', args: ['self', 'bVal'], description: 'Called when the checkbox state changes.' },
  ],
  [ComponentType.DComboBox]: [
    { name: 'OnSelect', args: ['self', 'index', 'value', 'data'], description: 'Called when an option is selected.' },
  ],
  [ComponentType.DListView]: [
    { name: 'OnRowSelected', args: ['self', 'rowIndex', 'row'], description: 'Called when a row is selected.' },
    { name: 'OnRowRightClick', args: ['self', 'rowIndex', 'row'], description: 'Called when a row is right-clicked.' },
    { name: 'DoDoubleClick', args: ['self', 'rowIndex', 'row'], description: 'Called when a row is double-clicked.' },
    { name: 'OnClickLine', args: ['self', 'line', 'isSelected'], description: 'Called when a line is clicked.' },
  ],
  [ComponentType.DColorMixer]: [
    { name: 'ValueChanged', args: ['self', 'color'], description: 'Called when the color changes.' },
  ],
  [ComponentType.DNumSlider]: [
    { name: 'OnValueChanged', args: ['self', 'value'], description: 'Called when the slider value changes.' },
  ],
};

export const getMethodsForComponent = (type: ComponentType): MethodSignature[] => {
  const specific = COMPONENT_METHODS[type] || [];
  return [...specific, ...COMMON_PANEL_METHODS].sort((a, b) => a.name.localeCompare(b.name));
};
