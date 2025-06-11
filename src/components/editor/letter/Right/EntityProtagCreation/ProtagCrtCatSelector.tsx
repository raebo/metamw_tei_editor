import React, { useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ProtagCreationCategory } from '../../../../../services/mappings/editorMappings';

interface CategorySelectorProps {
  categories: ProtagCreationCategory[];
  handleCategorySelected: (category: ProtagCreationCategory, parentCategoryChain: ProtagCreationCategory[]) => void;
}

function getParentChain(
  category: ProtagCreationCategory,
  allCategories: ProtagCreationCategory[]
): ProtagCreationCategory[] {
  const parents: ProtagCreationCategory[] = [];
  let current = category;

  while (current.protagCreationCategoryId !== null) {
    const parent = allCategories.find(
      (c) => c.id === current.protagCreationCategoryId
    );
    if (!parent) break
    parents.push(parent);
    current = parent;
  }

  return parents;
}

const ProtagCrtCatSelector= (props: CategorySelectorProps) => {
  const [level1, setLevel1] = useState<ProtagCreationCategory | null>(null);
  const [level2, setLevel2] = useState<ProtagCreationCategory | null>(null);
  const [level3, setLevel3] = useState<ProtagCreationCategory | null>(null);
  const [level4, setLevel4] = useState<ProtagCreationCategory | null>(null);

  const getChildren = (parentId: number | null) => {
    return props.categories.filter(cat => cat.protagCreationCategoryId === parentId);
  }

  const level1Options = getChildren(null);
  const level2Options = level1 ? getChildren(level1.id) : [];
  const level3Options = level2 ? getChildren(level2.id) : [];
  const level4Options = level3 ? getChildren(level3.id) : [];

  // Reset child selections when parent changes
  const handleSelect = (level: number, cat: ProtagCreationCategory | null) => {
    if (cat !== null) {
      props.handleCategorySelected(cat, getParentChain(cat, props.categories));
    }

    if (level === 1) {
      setLevel1(cat);
      setLevel2(null);
      setLevel3(null);
      setLevel4(null);
    } else if (level === 2) {
      setLevel2(cat);
      setLevel3(null);
      setLevel4(null);
    } else if (level === 3) {
      setLevel3(cat);
      setLevel4(null);
    } else if (level === 4) {
      setLevel4(cat);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <Autocomplete
          options={level1Options}
          value={level1}
          getOptionLabel={opt => opt.name}
          onChange={(e, val) => handleSelect(1, val)}
          renderInput={params => <TextField {...params} label="Kategorie 1" />}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <Autocomplete
          options={level2Options}
          value={level2}
          getOptionLabel={opt => opt.name}
          onChange={(e, val) => handleSelect(2, val)}
          renderInput={params => <TextField {...params} label="Kategorie 2" />}
          disabled={!level1}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <Autocomplete
          options={level3Options}
          value={level3}
          getOptionLabel={opt => opt.name}
          onChange={(e, val) => handleSelect(3, val)}
          renderInput={params => <TextField {...params} label="Kategorie 3" />}
          disabled={!level2}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 12, lg: 12 }}>
        <Autocomplete
          options={level4Options}
          value={level4}
          getOptionLabel={opt => opt.name}
          onChange={(e, val) => handleSelect(4, val)}
          renderInput={params => <TextField {...params} label="Kategorie 4" />}
          disabled={!level3}
        />
      </Grid>
    </Grid>
  );
};

export default ProtagCrtCatSelector;
