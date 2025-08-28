import React, {useEffect, useState} from "react";
import { Menu, MenuItem, Divider, Typography } from "@mui/material";
import {createContextMenuItems, MenuItemType} from "../../Util/ContextMenuLetterItems";
import {useAppDispatch} from "../../../../../redux/hooks";
import {useSelector} from "react-redux";
import {RootState} from "../../../../../redux/redux.store";
import {EditorConstants, LetterState} from "../../../../../constants/editor";
import {EditorUtils} from "../../../../../utils/editor";
import {
	setDialogType, setEditorLetterActOfWriting,
	setEditorSelectedItem, setNodeClicked,
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

	const stateTeiXml = useSelector((state: RootState) => state.editorLetter.letter.xmlContent)
	const xmlDocRef = React.useRef<XMLDocument | null>(null);

	useEffect(() => {
		if (!stateTeiXml) {
			dispatch(setReloadLetterContent({ reloadLetterContent: true }));
			return;
		}

		try {
			xmlDocRef.current = EditorUtils.xmlCheck.extractTeiDocumentFromString(stateTeiXml);
		} catch (err) {
			enqueueSnackbar(MiscUtils.misc.getErrorMessage(err), { variant: "error" });
			xmlDocRef.current = null;
		}
	}, [stateTeiXml, dispatch]);

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

		if (useFallBack) {
			if (xmlContentRef.current !== null) {
				removeMarkedSpans(xmlContentRef.current);
				props.setLetterState({
					viewMode: "WYSIWYG",
					xmlContent: xmlContentRef.current?.innerHTML ?? ""
				})
			}
		}

		return () => {
			if (contentTextIsMarked) {
				contextMenuElement.removeEventListener(
					"contextmenu",
					handleContextMenuTextIsMarked
				);
			}
		};
	}, [contentTextIsMarked ]);

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

	const menuItemsNoMarking : MenuItemType[] = React.useMemo(() => [
		{ identifier: EditorConstants.menuItemTypes.WRITING_ACT.LABEL_MOVE_DOWN, label: "Verschieben Unten", type: 'inactive' },
		{ identifier: EditorConstants.menuItemTypes.WRITING_ACT.LABEL_MOVE_UP, label: "Verschieben Oben", type: 'inactive'},
		{ identifier: EditorConstants.menuItemTypes.WRITING_ACT.MOVE_DOWN, label: "Verschieben Unten", action: async ({node}: { node?: Node}) =>
			{
				try {
					const currentDoc = xmlDocRef.current;
					if (!currentDoc) {
						enqueueSnackbar("No xml document found", { variant: "error" });
						return;
					}
					EditorUtils.writingActContent.moveActDown(currentDoc, node as Element)

					const result = await EditorUtils.backendService.patchContent(
						new XMLSerializer().serializeToString(currentDoc), stateEditorLetter.id, EditorConstants.changeTypes.writing_act.CHANGED_ORDER, null
					)

					if (result) {
						dispatch(setReloadLetterContent({ reloadLetterContent: true }))
						enqueueSnackbar("Schreibakt wurde verschoben", { variant: "success" })
					} else {
						enqueueSnackbar("Data could not be updated on backend side", { variant: "error" })
					}

				} catch (error) {
					console.log("error", error)
					enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: "error" });
				}
			}
		},
		{ identifier: EditorConstants.menuItemTypes.WRITING_ACT.MOVE_UP, label: "Verschieben Oben", action: async ({node}: { node?: Node}) =>
			{
				try {
					const currentDoc = xmlDocRef.current;
					if (!currentDoc) {
						enqueueSnackbar("No xml document found", { variant: "error" });
						return;
					}
					EditorUtils.writingActContent.moveActUp(currentDoc, node as Element)

					const result = await EditorUtils.backendService.patchContent(
						new XMLSerializer().serializeToString(currentDoc), stateEditorLetter.id, EditorConstants.changeTypes.writing_act.CHANGED_ORDER, null
					)

					if (result) {
						dispatch(setReloadLetterContent({ reloadLetterContent: true }))
						enqueueSnackbar("Schreibakt wurde verschoben", { variant: "success" })
					} else {
						enqueueSnackbar("Data could not be updated on backend side", { variant: "error" })
					}

				} catch (error) {
					enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: "error" });
				}

			}
		},
		{
			identifier: EditorConstants.menuItemTypes.WRITING_ACT.MANAGE_AUTHOR_WRITER, label: "Schreiber/Autoren Verwalten", action: async ({node}: { node?: Node }) => {
				try {
					if (!node) throw new Error("No node given as value")

					const numberOfAct = (node as Element).getAttribute('n');

					if (!numberOfAct) throw new Error("No act number found on node")

					dispatch(setEditorLetterActOfWriting({ letter: { actOfWriting: { orderNumber: numberOfAct } }  } ))
					dispatch(setDialogType({ dialogType: EditorConstants.dialogTypes.MANAGE_WRITING_ACT_AUTHOR_WRITER}))
				} catch(error) {
					enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), { variant: "error" });
				}
			}
		},
		{
			identifier: EditorConstants.menuItemTypes.DELETE_NODE, label: 'Eintrag Entfernen', action: async ({ node }: { node?: Node }) => {
				try {
					if (!node) throw new Error("No node given as value")

					const anchNode = EditorUtils.rightClickPathHandles.findAnchestorPathNode(node)

					if (!anchNode) throw new Error("No anchNode found with given path")

					const xmlContent =
						EditorUtils.rightClickPathHandles.removeNode(
							node,
							anchNode.afterActionCallback,
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
			}
		},
		{
			identifier: EditorConstants.menuItemTypes.MANAGE_WRITER_AUTHOR_HEADER, label: 'Autoren/Schreiber Verwalten', action: async ({node}: { node?: Node }) => {
				try {
					if(!node) throw new Error("No node given as value")

					dispatch(setDialogType({ dialogType: EditorConstants.dialogTypes.MANAGE_HEADER_AUTHOR_WRITER}))

				} catch (error) {
					enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), {variant: "error"});
				}
			}
		},
		{
			identifier: EditorConstants.menuItemTypes.MANAGE_RECEIVER, label: 'Empfänger Verwalten', action: async ({node}: { node?: Node }) => {
				try {
					if (!node) throw new Error("No node given as value")

					dispatch(setDialogType({ dialogType: EditorConstants.dialogTypes.MANAGE_HEADER_RECEIVER}))

				} catch (error) {
					enqueueSnackbar(MiscUtils.misc.getErrorMessage(error), {variant: "error"});
				}
			}
		}
	], [stateTeiXml]);


	useEffect(() => {
		const contextMenuElement = xmlContentRef.current // xmlRef of letter container
		if (!contextMenuElement) return;

		const handleContextMenuNodeClicked = (event: MouseEvent) => {
			event.preventDefault(); // Prevent default context menu
			props.setAnchorPosition({ top: event.clientY, left: event.clientX });
		}

		if (nodeClicked) {
			contextMenuElement.addEventListener("contextmenu", handleContextMenuNodeClicked);
		}

		return () => {
			contextMenuElement.removeEventListener(
				"contextmenu",
				handleContextMenuNodeClicked
			);
		};

	}, [nodeClicked]);


	const handleNoMarkupRightClick = (event: MouseEvent) => {
		if (event.button !== 2) return; // Only right-click
		event.preventDefault();

		const getMenuItem = (id: string) =>
			menuItemsNoMarking.find(item => item.identifier === id);

		const hasNoUndefinedItems = (items: (MenuItemType | undefined)[]) =>
			items.every(item => item !== undefined);

		const menuItemsToAdd : MenuItemType[] = []
		const isClickableNode : boolean[] = []

		EditorUtils.xmlCheck.isNodeMatchingPath(
			event.target as Node,
			EditorUtils.rightClickPathHandles.manageWritingActPaths(),
			(node: Node) => {

				setSelectedNode(node);

				const itemsToAdd: (MenuItemType | undefined)[] = [
					getMenuItem(EditorConstants.menuItemTypes.WRITING_ACT.MANAGE_AUTHOR_WRITER),
					getMenuItem(
						EditorUtils.writingActContent.currentActIsMovableUp(node as Element)
							? EditorConstants.menuItemTypes.WRITING_ACT.MOVE_UP
							: EditorConstants.menuItemTypes.WRITING_ACT.LABEL_MOVE_UP
					),
					getMenuItem(
						EditorUtils.writingActContent.currenActIsMovableDown(node as Element)
							? EditorConstants.menuItemTypes.WRITING_ACT.MOVE_DOWN
							: EditorConstants.menuItemTypes.WRITING_ACT.LABEL_MOVE_DOWN
					),
				];

				if (hasNoUndefinedItems(itemsToAdd)) {
					itemsToAdd.map(item => {
						if (item) menuItemsToAdd.push(item);
					})
					isClickableNode.push(true);
				}
			},
			(message: string) => {
				isClickableNode.push(false);
			}
		);

		EditorUtils.xmlCheck.isNodeMatchingPath(
			event.target as Node,
			EditorUtils.rightClickPathHandles.deletableAnchestorPaths(),
			(node: Node) => {

				EditorUtils.textMarking.removeMarkedSpans(xmlContentRef.current);
				setSelectedNode(node)

				const itemToAdd = getMenuItem(EditorConstants.menuItemTypes.DELETE_NODE)

				if (itemToAdd) {
					menuItemsToAdd.push(itemToAdd);
					setDisplayMenuItems([ ...displayMenuItems, itemToAdd]);
					isClickableNode.push(true);
				}
			},
			(message: string) => {
				isClickableNode.push(false);
			}
		);
		EditorUtils.xmlCheck.isNodeMatchingPath(
			event.target as Node,
			EditorUtils.rightClickPathHandles.manageAuthorWriterAnchestorPaths(),
			(node: Node) => {

				setSelectedNode(node)
				const itemToAdd = getMenuItem(EditorConstants.menuItemTypes.MANAGE_WRITER_AUTHOR_HEADER)

				if (itemToAdd) {
					menuItemsToAdd.push(itemToAdd);
					isClickableNode.push(true);
				}
			},
			(message: string) => {
				isClickableNode.push(false);
			}
		);

		EditorUtils.xmlCheck.isNodeMatchingPath(
			event.target as Node,
			EditorUtils.rightClickPathHandles.manageReceiverAnchestorPaths(),
			(node: Node) => {

				setSelectedNode(node)
				const itemToAdd = getMenuItem(EditorConstants.menuItemTypes.MANAGE_RECEIVER)

				if (itemToAdd) {
					menuItemsToAdd.push(itemToAdd);
					isClickableNode.push(true);
				}
			},
			(message: string) => {
				isClickableNode.push(false);
			}
		)

		if (isClickableNode.filter((entry) => entry ).length === 0) {
			props.setAnchorPosition(null)
			dispatch(setNodeClicked({nodeClicked: false}));

			return
		}


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

		setDisplayMenuItems([ ...displayMenuItems, ...menuItemsToAdd]);

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
					) : item.type === "inactive" ? (
						<MenuItem key={index} disabled sx={{ fontSize: '90%', opacity: 1, fontWeight: 'normal' }}>
							{ item.label }
						</MenuItem>
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
