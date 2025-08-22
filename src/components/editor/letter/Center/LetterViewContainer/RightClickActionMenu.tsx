import React, {useEffect, useState} from "react";
import { Menu, MenuItem, Divider, Typography } from "@mui/material";
import {createContextMenuItems, MenuItemType} from "../../Util/ContextMenuLetterItems";
import {useAppDispatch} from "../../../../../redux/hooks";
import {useSelector} from "react-redux";
import {RootState} from "../../../../../redux/redux.store";
import {EditorConstants, LetterState} from "../../../../../constants/editor";
import {EditorUtils} from "../../../../../utils/editor";
import {
	setDialogType,
	setEditorSelectedItem,
	setReloadLetterContent
} from "../../../../../redux/slices/editor.letter.slice";
import {enqueueSnackbar} from "notistack";
import {MiscUtils} from "../../../../../utils/misc";
import {removeMarkedSpans} from "../../../../../utils/auto_anno/domHandling";
import {
	setEditorMarkedAndContentLeftRightThunk,
	setEditorNodeClickedAndContentLeftRightThunk
} from "../../../../../redux/thunks/editor.letter.thunk";

interface UserActionMenuProps {
	xmlContentRef: React.RefObject<HTMLDivElement>;
	setLetterState: (
		letterState : LetterState,
	) => void;
	anchorPosition: { top: number; left: number } | null;
	setAnchorPosition: (position: { top: number; left: number } | null) => void;
}

const RightClickActionMenu = ( props: UserActionMenuProps ) => {
	const dispatch = useAppDispatch();
	const contentTextIsMarked = useSelector((state: RootState) => state.editorLetter.content.textIsMarked);
	const stateEditorLetter = useSelector((state: RootState) => state.editorLetter.letter)
	const nodeClicked = useSelector((state: RootState) => state.editorLetter.content.nodeClicked);
	const xmlContentRef = props.xmlContentRef;
	const [selectedNode, setSelectedNode] = useState<Node | null>(null);
	const [displayMenuItems, setDisplayMenuItems] = useState<MenuItemType[]>([]);
	const [submenuAnchorEl, setSubmenuAnchorEl] = useState<null | HTMLElement>(null);
	const [openSubmenuIndex, setOpenSubmenuIndex] = useState<number | null>(null);

	useEffect(() => {
		if (
			xmlContentRef.current
		) {
			xmlContentRef.current.addEventListener("mouseup", handleMouseUpMarkedElements);
			xmlContentRef.current.addEventListener("mousedown", handleNoMarkupRightClick);
		}

		return () => {
			if (xmlContentRef.current) {
				xmlContentRef.current.removeEventListener("mouseup", handleMouseUpMarkedElements);
				xmlContentRef.current.removeEventListener("mousedown", handleNoMarkupRightClick);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.xmlContentRef]);


	const menuItemsNoMarking : MenuItemType[] = [
		{ label: 'Eintrag Entfernen', action: async ({ node }: { node?: Node }) => {
				try {
					if (!node) throw new Error("No node given as value")

					const anchNode = EditorUtils.removeNodeHandles.findAnchestorPathNode(node)

					if (!anchNode) throw new Error("No anchNode found with given path")

					const xmlContent =
						EditorUtils.removeNodeHandles.removeNode(
							node,
							anchNode.afterDeleteCallback,
						);

					if (!xmlContent) throw new Error("No xml content found");

					const result = await EditorUtils.backendService.patchContent(
						xmlContent,
						stateEditorLetter.id,
						EditorConstants.changeTypes.NODE_REMOVED,
						null,
					)
					if (result) {

						dispatch(setReloadLetterContent({ reloadLetterContent: true }))
						enqueueSnackbar(`${anchNode.nodeType.name} wurde entfernt`, { variant: "success" })
					} else {
						enqueueSnackbar("Data could not be updated on backend side", { variant: "error" })
					}
				} catch(error) {
					enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: "error" });
				}
			} },
	]

	const handleMenuItemClick = (selectedItemLeft: string | null, selectedItemRight: string | null) => {
		props.setAnchorPosition(null)
		dispatch(setEditorSelectedItem({ selectedItem: { left: selectedItemLeft, right: selectedItemRight } }))
	}

	const handleMenuItemDialogClick = (dialogType: string ) => {
		props.setAnchorPosition(null)
		dispatch(setDialogType({ dialogType: dialogType }));
	}

	const menuItems = createContextMenuItems({
		handleMenuItemClick,
		handleMenuItemDialogClick,
	});

	useEffect(() => {
		let useFallBack = true

		const contextMenuElement = xmlContentRef.current // xmlRef of letter container

		if (!contextMenuElement) return;

		const handleContextMenuTextIsMarked = (event: MouseEvent) => {
			const target = event?.target as HTMLElement;
			if (target && target.tagName.toLowerCase() === 'span' && target.classList.contains('marked')) {
				event.preventDefault(); // Prevent default context menu
				props.setAnchorPosition({ top: event.clientY, left: event.clientX });
			}
		}

		if (contentTextIsMarked) {
			contextMenuElement.addEventListener("contextmenu", handleContextMenuTextIsMarked);
			useFallBack = false;
		}

		const handleContextMenuNodeClicked = (event: MouseEvent) => {
			event.preventDefault(); // Prevent default context menu
			props.setAnchorPosition({ top: event.clientY, left: event.clientX });
		}


		if (nodeClicked) {
			contextMenuElement.addEventListener("contextmenu", handleContextMenuNodeClicked);
			useFallBack = false
		}

		if (useFallBack) {
			console.log("138 useFallBack: ", useFallBack)
			if (xmlContentRef.current !== null) {
				removeMarkedSpans(xmlContentRef.current);
				props.setLetterState({
					viewMode: "WYSIWYG",
					xmlContent: xmlContentRef.current?.innerHTML ?? ""
				})
			}
		}
	}, [contentTextIsMarked, nodeClicked]);


	const handleMouseUpMarkedElements = (event: MouseEvent) => {
		const selection = window.getSelection();

		if (selection && selection.toString().length > 0) {
			EditorUtils.textMarking.isValidSelection(
				selection,
				xmlContentRef.current as HTMLElement,
				(selection: Selection) => {

					EditorUtils.textMarking.removeMarkedSpans(xmlContentRef.current);
					EditorUtils.textMarking.markValidSelection(selection, selection.getRangeAt(0));

					dispatch(setEditorMarkedAndContentLeftRightThunk({
						textIsMarked: true,
						contentLeft: null,
						contentRight: null
					}));

					setDisplayMenuItems(menuItems);
				},
				(message: string) => {
					console.log("189 handleMouseUpMarkedElements: ", message);
					EditorUtils.textMarking.removeMarkedSpans(xmlContentRef.current);
					props.setLetterState({
						viewMode: "WYSIWYG",
						xmlContent: xmlContentRef.current?.innerHTML ?? ""
					})

					dispatch(setEditorMarkedAndContentLeftRightThunk({
						textIsMarked: false,
						contentLeft: null,
						contentRight: null
					}));

					enqueueSnackbar(message, { variant: "error" });
				}
			);
		}
	};

	const handleNoMarkupRightClick = (event: MouseEvent) => {
		if (event.button !== 2) return; // Only right-click

		EditorUtils.xmlCheck.isADeletableNode(
			event.target as Node,
			(node: Node) => {

				event.preventDefault();

				EditorUtils.textMarking.removeMarkedSpans(xmlContentRef.current);
				setSelectedNode(node)
				setDisplayMenuItems(menuItemsNoMarking);
				props.setLetterState({
					viewMode: "WYSIWYG",
					xmlContent: xmlContentRef.current?.innerHTML ?? ""
				})

				dispatch(setEditorNodeClickedAndContentLeftRightThunk({
					nodeClicked: true,
					textIsMarked: false,
					contentLeft: null,
					contentRight: null
				}));
			},
			(message: string) => {
				// If the node is not deletable, we can do anything we want, e.g. show a message
			}
		);
	};

	const handleCloseAll = () => {
		setSubmenuAnchorEl(null);
		setOpenSubmenuIndex(null);
		props.setAnchorPosition(null);
		setSelectedNode(null);
	};

	return (
		<>
			<Menu
				open={Boolean(props.anchorPosition)}
				onClose={handleCloseAll}
				anchorReference="anchorPosition"
				anchorPosition={
					props.anchorPosition
						? { top: props.anchorPosition.top, left: props.anchorPosition.left }
						: undefined
				}
			>
				{ displayMenuItems.map((item, index) =>
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

			{ openSubmenuIndex !== null && displayMenuItems[openSubmenuIndex]?.subMenu && (
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
					{ displayMenuItems[openSubmenuIndex]!.subMenu!.map((subItem, subIndex) => (
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
