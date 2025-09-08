import React from "react";
import {
	Card,
	CardContent,
	Typography,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Checkbox,
	FormControlLabel,
	Divider,
	IconButton,
	Button,
} from "@mui/material";
import Grid from '@mui/material/Grid';


import { Add, Delete } from "@mui/icons-material";
import {ContentAddressEntry, ContentAddrLine, validParagraphClasses} from "../../../../../constants/editor";

type Props = {
	entry: ContentAddressEntry;
	onChange: (updated: ContentAddressEntry) => void;
};

export default function ContentAddressEntryForm({ entry, onChange }: Props) {
	const handleChange = (key: keyof ContentAddressEntry, value: any) => {
		onChange({ ...entry, [key]: value });
	};

	const updateAddrLine = (index: number, key: keyof ContentAddrLine, value: any) => {
		const updated = [...entry.addrLines];
		updated[index] = { ...updated[index], [key]: value };
		handleChange("addrLines", updated);
	};

	const addAddrLine = () => {
		handleChange("addrLines", [...entry.addrLines, { content: "", rendType: null }]);
	};

	const removeAddrLine = (index: number) => {
		const updated = entry.addrLines.filter((_, i) => i !== index);
		handleChange("addrLines", updated);
	};

	const formIsDisabled = entry.deleteAddress;

	return (
		<>
			<Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
				<CardContent>
					<FormControlLabel
						control={
							<Checkbox
								disabled={entry.isNewEntry}
								checked={entry.deleteAddress}
								onChange={(e) => handleChange("deleteAddress", e.target.checked)}
							/>
						}
						label="Eintrag löschen"
					/>
				</CardContent>
			</Card>
			<Card>
				<CardContent>
					<FormControlLabel
						control={
							<Checkbox
								disabled={formIsDisabled}
								checked={entry.hasHead}
								onChange={(e) => handleChange("hasHead", e.target.checked)}
							/>
						}
						label="Header Class?"
					/>
					<FormControlLabel
						control={
							<Checkbox
								disabled={formIsDisabled}
								checked={entry.hasParagraph}
								onChange={(e) => handleChange("hasParagraph", e.target.checked)}
							/>
						}
						label="Paragraph Class?"
					/>
					<div className="autoSnippetFormRow">
								<FormControl fullWidth>
									<InputLabel>Paragraph Ausrichtung</InputLabel>
									<Select
										disabled={!entry.hasParagraph || formIsDisabled}
										value={entry.paragraph || ""}
										onChange={(e) =>
											handleChange(
												"paragraph",
												validParagraphClasses.includes(e.target.value) ? e.target.value : null
											)
										}
									>
										<MenuItem value="">Keine</MenuItem>
										<MenuItem value="paragraph_left">Links</MenuItem>
										<MenuItem value="paragraph_center">Mitte</MenuItem>
										<MenuItem value="paragraph_right">Rechts</MenuItem>
									</Select>
								</FormControl>
					</div>
				</CardContent>
			</Card>

				<Divider sx={{ my: 2 }} />

			<Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 2, mb: 3 }}>
				<CardContent>
					<Typography variant="subtitle1" gutterBottom>
						Adresszeilen
					</Typography>
					{ entry.addrLines.map((line, index) => (
						<Grid container spacing={2} alignItems="center" key={index} sx={{ mb: 1 }}>
							<Grid sx={{ xs:8, minWidth: { xs: "30%", sm: "40%", md: "45%", lg: "70%" } }}>
								<TextField
									fullWidth
									disabled={formIsDisabled}
									label={`Line ${index + 1}`}
									value={line.content}
									onChange={(e) => updateAddrLine(index, "content", e.target.value)}
								/>
							</Grid>
							<Grid sx={{ xs:3, minWidth: { xs: "15%", sm: "20%", md: "20%", lg: "20%" } }}>
								<FormControl
									fullWidth
									sx={{ minWidth: 120 }}
								>
									<InputLabel>Sprach (Typ)</InputLabel>
									<Select
										value={line.rendType || ""}
										onChange={(e) =>
											updateAddrLine(index, "rendType", e.target.value || null)
										}
									>
										<MenuItem value="">None</MenuItem>
										<MenuItem value="latintype">Latin</MenuItem>
									</Select>
								</FormControl>
							</Grid>
							<Grid sx={{ xs:1, minWidth: { xs: "5%", sm: "5%", md: "5%", lg: "5%" } }}>
								<IconButton color="error" onClick={() => removeAddrLine(index)}>
									<Delete />
								</IconButton>
							</Grid>
						</Grid>
					))}
					<Button startIcon={<Add />} onClick={addAddrLine} disabled={formIsDisabled}>
						Adresszeile hinzufügen
					</Button>
				</CardContent>
			</Card>
		</>
	);
}
