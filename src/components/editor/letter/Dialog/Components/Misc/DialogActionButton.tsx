import React from "react";
import { DialogActions, Button, ButtonProps } from "@mui/material";
import {EditorConstants} from "../../../../../../constants/editor";

interface DialogActionButtonProps {
	label: string;
	onClick: () => void;
	disabled?: boolean;
	color?: ButtonProps["color"];
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
}

export const DialogActionButton: React.FC<DialogActionButtonProps> = ({
																																				label,
																																				onClick,
																																				disabled = false,
																																				color = "success",
																																				variant = "contained",
																																				size = EditorConstants.styles.panel.buttonSize,
																																			}) => {
	return (
		<DialogActions sx={{ paddingTop: 5 }}>
			<Button
				variant={variant}
				color={color}
				size={size}
				disabled={disabled}
				onClick={onClick}
				sx={{ marginRight: "2vh" }}
			>
				{label}
			</Button>
		</DialogActions>
	);
};
