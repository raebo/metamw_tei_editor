import React, { useState } from "react";
import { Menu, MenuItem, Divider, Typography } from "@mui/material";
import {MenuItemType} from "../../Util/ContextMenuLetterItems";

interface UserActionMenuProps {
	anchorPosition: { top: number; left: number } | null;
	onClose: () => void;
	items: MenuItemType[];
	selectedNode?: any;
}

const RightClickActionMenu: React.FC<UserActionMenuProps> = ({
																									 anchorPosition,
																									 onClose,
																									 items,
																									 selectedNode,
																								 }) => {
	const [submenuAnchorEl, setSubmenuAnchorEl] = useState<null | HTMLElement>(null);
	const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);

	const handleCloseAll = () => {
		setSubmenuAnchorEl(null);
		setOpenSubmenuIndex(null);
		onClose();
	};

	return (
		<>
			<Menu
				open={Boolean(anchorPosition)}
				onClose={handleCloseAll}
				anchorReference="anchorPosition"
				anchorPosition={
					anchorPosition
						? { top: anchorPosition.top, left: anchorPosition.left }
						: undefined
				}
			>
				{items.map((item, index) =>
					item.type === "divider" ? (
						<Divider key={index} />
					) : (
						<MenuItem
							key={index}
							onClick={(e) => {
								if (item.hasSubMenu) {
									setSubmenuAnchorEl(e.currentTarget);
									setOpenSubmenuIndex(index);
								} else {
									item.action?.(selectedNode ? { node: selectedNode } : {});
									handleCloseAll();
								}
							}}
							onMouseEnter={(e) => {
								if (item.hasSubMenu) {
									setSubmenuAnchorEl(e.currentTarget);
									setOpenSubmenuIndex(index);
								}
							}}
							onMouseLeave={() => {
								if (!item.hasSubMenu) {
									setOpenSubmenuIndex(null);
									setSubmenuAnchorEl(null);
								}
							}}
						>
							<Typography variant="body2">{item.label}</Typography>
							{item.hasSubMenu && <span style={{ marginLeft: "auto" }}>▶</span>}
						</MenuItem>
					)
				)}
			</Menu>

			{openSubmenuIndex !== null && items[openSubmenuIndex]?.subMenu && (
				<Menu
					anchorEl={submenuAnchorEl}
					open={Boolean(submenuAnchorEl)}
					onClose={() => {
						setSubmenuAnchorEl(null);
						setOpenSubmenuIndex(null);
					}}
					anchorOrigin={{
						vertical: "top",
						horizontal: "right",
					}}
					transformOrigin={{
						vertical: "top",
						horizontal: "left",
					}}
				>
					{items[openSubmenuIndex]!.subMenu!.map((subItem, subIndex) => (
						<MenuItem
							key={subIndex}
							onClick={() => {
								subItem.action?.(selectedNode ? { node: selectedNode } : {});
								handleCloseAll();
							}}
						>
							<Typography variant="body2">{subItem.label}</Typography>
						</MenuItem>
					))}
				</Menu>
			)}
		</>
	);
};

export default RightClickActionMenu;
