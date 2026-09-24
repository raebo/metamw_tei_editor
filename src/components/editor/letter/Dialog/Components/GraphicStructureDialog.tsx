import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Checkbox, Divider, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '@src/redux/redux.store';
import { EditorConstants } from '@src/constants/editor';
import type { DefaultDialogProps } from '../EditorFormDialog';
import { resolveSourceElement } from '@src/utils/editor/paragraphStructure';
import {
  deleteFigureImageMap,
  insertGraphicFigure,
  readFigureImageMap,
  updateFigureImageMap,
  type GraphicAlignment,
  type GraphicFigureInput,
  type GraphicMimeType,
  type GraphicRend,
  type GraphicSubtype,
  type GraphicType,
  type ImageMapZone,
} from '@src/utils/editor/graphicStructure';
import { MiscUtils } from '@src/utils/misc';

export type GraphicStructureOperation = 'graphic-block' | 'graphic-inline-copy' | 'image-map-edit';

const nextZoneId = (doc: Document, zones: ImageMapZone[]): string => {
  const existing = new Set([
    ...Array.from(doc.getElementsByTagName('*')).map((element) => element.getAttribute('xml:id')),
    ...zones.map((zone) => zone.id),
  ]);
  let suffix = 1;
  while (existing.has(`zone_${suffix}`)) suffix += 1;
  return `zone_${suffix}`;
};

const emptyRectangle = (doc: Document, zones: ImageMapZone[]): ImageMapZone => ({
  id: nextZoneId(doc, zones),
  shape: 'rectangle',
  label: '',
  target: '',
  ulx: 0,
  uly: 0,
  lrx: 100,
  lry: 100,
});

const GraphicStructureDialog = (props: DefaultDialogProps) => {
  const { t } = useTranslation();
  const reference = useSelector((state: RootState) => state.editorLetter.letterReference);
  const operation = reference.elementKey as GraphicStructureOperation | null;
  const sourcePath = reference.elementXmlId ?? '';
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [type, setType] = useState<GraphicType>('notated_Music');
  const [url, setUrl] = useState('');
  const [mimeType, setMimeType] = useState<GraphicMimeType>(null);
  const [rend, setRend] = useState<GraphicRend>('inline_big_size');
  const [subtype, setSubtype] = useState<GraphicSubtype>('eighth_page');
  const [alignment, setAlignment] = useState<GraphicAlignment>('center');
  const [head, setHead] = useState('');
  const [headVisible, setHeadVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionVisible, setDescriptionVisible] = useState(false);
  const [mapWidth, setMapWidth] = useState(1000);
  const [mapHeight, setMapHeight] = useState(1000);
  const [zones, setZones] = useState<ImageMapZone[]>([]);
  const [hasImageMap, setHasImageMap] = useState(false);
  const isImageMap = operation === 'image-map-edit';

  useEffect(() => {
    if (!props.xmlDoc || !isImageMap) return;
    try {
      const figure = resolveSourceElement(props.xmlDoc, sourcePath);
      if (figure.localName.toLowerCase() !== 'figure') throw new Error(t('editor:dialog.graphicStructure.errors.figureContext'));
      const imageMap = readFigureImageMap(figure);
      if (imageMap) {
        setHasImageMap(true);
        setMapWidth(imageMap.width);
        setMapHeight(imageMap.height);
        setZones(imageMap.zones);
      }
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  }, [isImageMap, props.xmlDoc, sourcePath, t]);

  const submitDisabled = useMemo(
    () => !operation || Boolean(errorMessage) || (isImageMap ? mapWidth <= 0 || mapHeight <= 0 : !url.trim()),
    [errorMessage, isImageMap, mapHeight, mapWidth, operation, url],
  );

  const save = () => {
    if (!props.xmlDoc || !operation) return;
    setErrorMessage(null);
    try {
      const source = resolveSourceElement(props.xmlDoc, sourcePath);
      let changedFigure: Element;
      if (operation === 'image-map-edit') {
        if (source.localName.toLowerCase() !== 'figure') throw new Error(t('editor:dialog.graphicStructure.errors.figureContext'));
        updateFigureImageMap(source, { width: mapWidth, height: mapHeight, zones });
        changedFigure = source;
      } else {
        const input: GraphicFigureInput = {
          layout: operation === 'graphic-block' ? 'block' : 'inline-graphic',
          type,
          url,
          mimeType,
          rend,
          subtype,
          alignment,
          head,
          headVisible,
          description,
          descriptionVisible,
        };
        changedFigure = insertGraphicFigure(source, input);
      }

      props.onSave(
        props.xmlDoc,
        EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED,
        t('editor:dialog.graphicStructure.success'),
        changedFigure.getAttribute('xml:id'),
      );
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  const removeImageMap = () => {
    if (!props.xmlDoc) return;
    setErrorMessage(null);
    try {
      const figure = resolveSourceElement(props.xmlDoc, sourcePath);
      deleteFigureImageMap(figure);
      props.onSave(
        props.xmlDoc,
        EditorConstants.changeTypes.misc.BODY_STRUCTURE_CHANGED,
        t('editor:dialog.graphicStructure.mapDeleted'),
        figure.getAttribute('xml:id'),
      );
    } catch (error) {
      setErrorMessage(MiscUtils.misc.getErrorMessage(error));
    }
  };

  const updateZone = (index: number, next: ImageMapZone) => {
    setZones((current) => current.map((zone, zoneIndex) => (zoneIndex === index ? next : zone)));
  };

  if (!operation) return <Alert severity="error">{t('editor:dialog.graphicStructure.errors.context')}</Alert>;

  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t(`editor:dialog.graphicStructure.operations.${operation}`)}</Alert>
      {errorMessage && (
        <Alert severity="error" role="alert">
          {errorMessage}
        </Alert>
      )}

      {!isImageMap && (
        <>
          <TextField
            select
            label={t('editor:dialog.graphicStructure.fields.type')}
            value={type}
            onChange={(event) => setType(event.target.value as GraphicType)}
          >
            {(['notated_Music', 'drawing', 'table', 'formula'] as const).map((value) => (
              <MenuItem key={value} value={value}>
                {t(`editor:dialog.graphicStructure.types.${value}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            required
            label={t('editor:dialog.graphicStructure.fields.url')}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            helperText={t('editor:dialog.graphicStructure.urlHint')}
          />
          <TextField
            select
            label={t('editor:dialog.graphicStructure.fields.mimeType')}
            value={mimeType ?? ''}
            onChange={(event) => setMimeType((event.target.value || null) as GraphicMimeType)}
          >
            <MenuItem value="">{t('editor:dialog.graphicStructure.mimeTypes.auto')}</MenuItem>
            <MenuItem value="image/jpeg">JPEG</MenuItem>
            <MenuItem value="image/png">PNG</MenuItem>
            <MenuItem value="image/svg+xml">SVG</MenuItem>
          </TextField>
          {mimeType === 'image/svg+xml' && <Alert severity="warning">{t('editor:dialog.graphicStructure.svgSafety')}</Alert>}
          {operation === 'graphic-block' && (
            <>
              <TextField
                select
                label={t('editor:dialog.graphicStructure.fields.rend')}
                value={rend}
                onChange={(event) => setRend(event.target.value as GraphicRend)}
              >
                {(['inline_big_size', 'below', 'above', 'bottom', 'top', 'margin', 'overleaf', 'inspace', 'opposite'] as const).map(
                  (value) => (
                    <MenuItem key={value} value={value}>
                      {t(`editor:dialog.graphicStructure.rend.${value}`)}
                    </MenuItem>
                  ),
                )}
              </TextField>
              <TextField
                select
                label={t('editor:dialog.graphicStructure.fields.subtype')}
                value={subtype}
                onChange={(event) => setSubtype(event.target.value as GraphicSubtype)}
              >
                {(['eighth_page', 'quarter_page', 'half_page', 'three-quarter_page', 'full_page'] as const).map((value) => (
                  <MenuItem key={value} value={value}>
                    {t(`editor:dialog.graphicStructure.subtypes.${value}`)}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}
          <TextField
            select
            label={t('editor:dialog.graphicStructure.fields.alignment')}
            value={alignment}
            onChange={(event) => setAlignment(event.target.value as GraphicAlignment)}
          >
            {(['center', 'left', 'right'] as const).map((value) => (
              <MenuItem key={value} value={value}>
                {t(`editor:dialog.graphicStructure.alignments.${value}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t('editor:dialog.graphicStructure.fields.head')}
            value={head}
            onChange={(event) => setHead(event.target.value)}
          />
          <FormControlLabel
            control={<Checkbox checked={headVisible} onChange={(event) => setHeadVisible(event.target.checked)} />}
            label={t('editor:dialog.graphicStructure.fields.headVisible')}
          />
          <TextField
            multiline
            minRows={2}
            label={t('editor:dialog.graphicStructure.fields.description')}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <FormControlLabel
            control={<Checkbox checked={descriptionVisible} onChange={(event) => setDescriptionVisible(event.target.checked)} />}
            label={t('editor:dialog.graphicStructure.fields.descriptionVisible')}
          />
        </>
      )}

      {isImageMap && (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              type="number"
              required
              label={t('editor:dialog.graphicStructure.fields.mapWidth')}
              value={mapWidth}
              slotProps={{ htmlInput: { min: 1 } }}
              onChange={(event) => setMapWidth(Number(event.target.value))}
            />
            <TextField
              type="number"
              required
              label={t('editor:dialog.graphicStructure.fields.mapHeight')}
              value={mapHeight}
              slotProps={{ htmlInput: { min: 1 } }}
              onChange={(event) => setMapHeight(Number(event.target.value))}
            />
          </Stack>
          {zones.map((zone, index) => (
            <Stack key={index} spacing={1.5} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle2">{t('editor:dialog.graphicStructure.area', { number: index + 1 })}</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('editor:dialog.graphicStructure.fields.zoneId')}
                  value={zone.id}
                  onChange={(event) => updateZone(index, { ...zone, id: event.target.value })}
                />
                <TextField
                  select
                  label={t('editor:dialog.graphicStructure.fields.shape')}
                  value={zone.shape}
                  onChange={(event) => {
                    const shape = event.target.value as ImageMapZone['shape'];
                    updateZone(
                      index,
                      shape === 'rectangle'
                        ? {
                            id: zone.id,
                            label: zone.label,
                            target: zone.target,
                            shape,
                            ulx: 0,
                            uly: 0,
                            lrx: 100,
                            lry: 100,
                          }
                        : {
                            id: zone.id,
                            label: zone.label,
                            target: zone.target,
                            shape,
                            points: '0,0 100,0 100,100',
                          },
                    );
                  }}
                >
                  <MenuItem value="rectangle">{t('editor:dialog.graphicStructure.shapes.rectangle')}</MenuItem>
                  <MenuItem value="polygon">{t('editor:dialog.graphicStructure.shapes.polygon')}</MenuItem>
                </TextField>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label={t('editor:dialog.graphicStructure.fields.zoneLabel')}
                  value={zone.label}
                  onChange={(event) => updateZone(index, { ...zone, label: event.target.value })}
                />
                <TextField
                  label={t('editor:dialog.graphicStructure.fields.zoneTarget')}
                  value={zone.target}
                  onChange={(event) => updateZone(index, { ...zone, target: event.target.value })}
                  placeholder="#xml_id"
                />
              </Stack>
              {zone.shape === 'rectangle' ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  {(['ulx', 'uly', 'lrx', 'lry'] as const).map((coordinate) => (
                    <TextField
                      key={coordinate}
                      type="number"
                      label={coordinate}
                      value={zone[coordinate]}
                      slotProps={{ htmlInput: { min: 0 } }}
                      onChange={(event) => updateZone(index, { ...zone, [coordinate]: Number(event.target.value) })}
                    />
                  ))}
                </Stack>
              ) : (
                <TextField
                  label={t('editor:dialog.graphicStructure.fields.points')}
                  value={zone.points}
                  onChange={(event) => updateZone(index, { ...zone, points: event.target.value })}
                  helperText="x1,y1 x2,y2 x3,y3"
                />
              )}
              <Button color="error" onClick={() => setZones((current) => current.filter((_item, zoneIndex) => zoneIndex !== index))}>
                {t('editor:dialog.graphicStructure.removeArea')}
              </Button>
            </Stack>
          ))}
          <Button variant="outlined" onClick={() => setZones((current) => [...current, emptyRectangle(props.xmlDoc, current)])}>
            {t('editor:dialog.graphicStructure.addArea')}
          </Button>
        </>
      )}

      <Divider />
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {isImageMap && hasImageMap && (
          <Button color="error" onClick={removeImageMap}>
            {t('editor:dialog.graphicStructure.deleteMap')}
          </Button>
        )}
        <Button variant="contained" disabled={submitDisabled} onClick={save}>
          {t('editor:dialog.graphicStructure.submit')}
        </Button>
      </Stack>
    </Stack>
  );
};

export default GraphicStructureDialog;
