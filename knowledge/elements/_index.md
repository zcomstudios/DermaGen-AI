# Element Index

Quick-reference status of every Derma element. Detail lives in the per-element file.

| Element                | Status | File                           | Notes |
|------------------------|:------:|--------------------------------|-------|
| DFrame                 | 🟢     | DFrame.md                      | Chunk 6 (2026-04-26). +icon/min*/screenLock/blur. |
| DButton                | 🟢     | DButton.md                     | Chunk 6 (2026-04-26). +enabled/icon/consoleCommand. |
| DLabel                 | 🟢     | DLabel.md                      | Chunk 6 (2026-04-26). +textColor/autoStretch. |
| DTextEntry             | 🟢     | DTextEntry.md                  | Chunk 6 (2026-04-26). +multiline/numeric/editable/placeholder/etc (8 props). |
| DPanel                 | 🟢     | DPanel.md                      | Chunk 6 (2026-04-26). +disabled/paintBackground. |
| DCheckBox              | 🟢     | DCheckBox.md                   | Chunk 5 (2026-04-26). Auto-emits DCheckBoxLabel when text is set. |
| DComboBox              | 🟢     | DComboBox.md                   | Chunk 5 (2026-04-26). Choices model + SetValue fix. |
| DListView              | 🟢     | DListView.md                   | Chunk 5 (2026-04-26). Real columns/rows model. |
| DPropertySheet         | 🟢     | _no per-file doc_              | Render + DTab post-traverse AddSheet. Sister of DColumnSheet (chunk 5). |
| DScrollPanel           | 🟢     | _no per-file doc_              | Just a panel with `overflowY: auto` on children container. |
| DImage                 | 🟢     | _no per-file doc_              | imageUrl + imageColor exist; SetImage + SetImageColor emitted. |
| DColorMixer            | 🟢     | DColorMixer.md                 | Chunk 3 (2026-04-24) |
| DSlider                | 🟢     | DSlider.md                     | Chunk 1 (2026-04-24) |
| DNumSlider             | 🟢     | DNumSlider.md                  | Chunk 1 (2026-04-24) |
| DCollapsibleCategory   | 🟢     | DCollapsibleCategory.md        | Chunk 2 (2026-04-24) |
| DTree                  | 🟢     | DTree.md                       | Chunk 4 (2026-04-26) |
| DColumnSheet           | 🟢     | DColumnSheet.md                | Chunk 5 (2026-04-26). Vertical-tab sibling of DPropertySheet. |
| DIconLayout            | 🟢     | DIconLayout.md                 | Chunk 4 (2026-04-26). Flex-wrap container. |
| DGrid                  | 🟢     | DGrid.md                       | Chunk 4 (2026-04-26). CSS-grid container. |
| DMenu                  | 🟢     | DMenu.md                       | Chunk 4 (2026-04-26). Static popup-menu preview. |
| DMenuBar               | 🟢     | DMenuBar.md                    | Chunk 4 (2026-04-26). |
| DHTML                  | 🟢     | DHTML.md                       | Chunk 3 (2026-04-24) |
| DBinder                | 🟢     | DBinder.md                     | Chunk 2 (2026-04-24) |
| DColorCube             | 🟢     | DColorCube.md                  | Chunk 3 (2026-04-24) |
| DColorPalette          | 🟢     | DColorPalette.md               | Chunk 3 (2026-04-24) |
| DForm                  | 🟢     | DForm.md                       | Chunk 5 (2026-04-26) audit — render unchanged; doc'd DCollapsibleCategory inheritance. |
| DImageButton           | 🟢     | DImageButton.md                | Chunk 1 (2026-04-24) |
| DModelPanel            | 🟢     | _no per-file doc_              | Editor preview is a placeholder cube (real models can't render in JS). modelPath + modelFov emit `:SetModel`/`:SetFOV`. |
| DNotify                | ⚪     | _deferred_                     | Programmatic; not a canvas element in real use. |
| DProgress              | 🟢     | DProgress.md                   | Chunk 1 (2026-04-24) |
| DRichText              | 🟢     | DRichText.md                   | Chunk 2 (2026-04-24) |
| DSysButton             | 🟢     | DSysButton.md                  | Chunk 3 (2026-04-24) |
| DTooltip               | ⚪     | _deferred_                     | Native tooltip; created via SetTooltip. |
| DVerticalDivider       | 🟢     | DVerticalDivider.md            | Chunk 2 (2026-04-24). Positional child semantics. |
| DNumberWang            | 🟢     | DNumberWang.md                 | Chunk 2 (2026-04-24). Reuses chunk-1 slider* family. |
| DBevel                 | 🟢     | DBevel.md                      | Chunk 1 (2026-04-24) |
| DTab                   | 🟢     | _no per-file doc_              | Renders inside DPropertySheet/DColumnSheet; AddSheet emitted via post-traverse. |
