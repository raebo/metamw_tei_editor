import {EditorConstants, LanguageOption} from "../../constants/editor";
import { EditorLetter } from "../../services/mappings/editorMappings";
import { SnippetEntity } from "../../services/mappings/autoAnnoMappings";

const TEI_NS = 'http://www.tei-c.org/ns/1.0';

function queryPath(root: Element, path: string): Element[] {
	if (!root.ownerDocument) return [];

	const xpath = path
		.split(">")
		.map(part => "tei:" + part.trim())
		.join("/");

	const nsResolver = (prefix: string | null): string | null => {
		if (prefix === "tei") return TEI_NS;
		return null;
	};

	if (!nsResolver)	{ throw new Error("Namespace resolver is not defined"); }

	const result = root.ownerDocument.evaluate(
		xpath,
		root,
		nsResolver,
		XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
		null
	);

	const elements: Element[] = [];
	for (let i = 0; i < result.snapshotLength; i++) {
		const el = result.snapshotItem(i);
		if (el && el.nodeType === Node.ELEMENT_NODE) {
			elements.push(el as Element);
		}
	}

	return elements;
}

export const teiHeaderContent = {
	titleElementHeadlines : (teiHeader: Element | null): { firstHeadline: string | null, sndHeadline: string | null } => {
		if (!teiHeader) {
			return { firstHeadline: null, sndHeadline: null };
		}

		let textBeforeLb = "";
		let textAfterLb = "";
		let foundLb = false;

		const titles = queryPath(teiHeader, "filedesc > titlestmt > title")
		const children = Array.from(titles[0].childNodes);

		children.forEach(node => {
			if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "lb") {
				foundLb = true;
			} else if (node.nodeType === Node.TEXT_NODE) {
				const text = node.textContent?.trim() ?? "";
				if (!foundLb) {
					textBeforeLb += text + " ";
				} else {
					textAfterLb += text + " ";
				}
			}
		});

		textBeforeLb = textBeforeLb.trim();
		textAfterLb = textAfterLb.trim();

		return { firstHeadline: textBeforeLb, sndHeadline: textAfterLb };
	},
	setTitleElementHeadlines : (teiHeader: Element, firstHeadline: string | null, sndHeadline: string | null): void => {
		const titles = queryPath(teiHeader, "filedesc > titlestmt > title");
		const children = Array.from(titles[0].childNodes);
		let foundLb = false

		children.forEach(node => {
			if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "lb") {
				foundLb = true;
			} else if (node.nodeType === Node.TEXT_NODE) {
				const text = node.textContent?.trim() ?? "";
				if (!foundLb) {
					node.textContent = firstHeadline
				} else {
					node.textContent = sndHeadline
				}
			}
		})
	},
	setPrevNextLetter : (teiHeader: Element, titleType: 'precursor' | 'successor', letterType: 'unknown' | 'not_identified' | 'select' | null, editorLetter: EditorLetter | null): void => {
		const titles = queryPath(teiHeader, `filedesc > titlestmt > title[@type='${titleType}']`)

		if (titles.length === 0) { throw new Error("No title headline found for type: " + titleType); }

		if (letterType === 'unknown' || letterType === 'not_identified') {
			titles[0].setAttribute("data-key", letterType);
			titles[0].textContent = letterType
			return;
		}

		if (!editorLetter) {
			throw new Error("No editor Letter given for type: " + titleType);
		}

		titles[0].setAttribute("data-key", editorLetter.name);
		titles[0].textContent = editorLetter.title;
	},
	extractPrevNextLetter : (teiHeader: Element | null, titleType: "precursor" | "successor" ): { title: string | null, name: string | null, letterPrefix: 'fmb' | 'gb' | null, letterStatus: 'unknown' | 'not_identified' | 'select' | null } => {
		if (!teiHeader) {
			throw new Error("No teiHeader given for: " + titleType);
		}

		const titles = queryPath(teiHeader, `filedesc > titlestmt > title[@type='${titleType}']`)

		if (titles.length === 0) return { title: null, name: null, letterPrefix: null, letterStatus: null };

		const title = titles[0];
		const letterStatus = title.getAttribute("data-key") as string | null;

		if (title.textContent) {
			const textContent = title.textContent.trim();
			const letterName = title.getAttribute("data-key")
			if (textContent.length > 0) {
				return {
					title: textContent,
					name: letterName,
					letterPrefix: letterName?.startsWith('fmb') ? 'fmb' : letterName?.startsWith('gb') ? 'gb' : null,
					letterStatus: 'select'
				}
			}
		} else {
			return {
				title: null,
				name: null,
				letterPrefix: null,
				letterStatus:
					letterStatus === 'unknown' || letterStatus === 'not_identified'
						? (letterStatus as 'unknown' | 'not_identified')
						: null,
			};
		}
		return { title: null, name: null, letterPrefix: null, letterStatus: null };
	},
	extractWritingPlace : (teiHeader: Element | null): { name: string | null, key: string | null } => {
		if (!teiHeader) { return { name: null, key: null }; }

		const writingPlaceElements = queryPath(teiHeader, 'profiledesc > correspdesc > correspaction[1] > placename > settlement');
		if (writingPlaceElements.length > 0) {
			const writingPlace = writingPlaceElements[0].textContent?.trim();
			return { name: writingPlace || null , key: writingPlaceElements[0].getAttribute('data-key') || null };
		}

		return { name: null, key: null };
	},
	setWritingPlace: (teiHeader: Element, settlement: SnippetEntity | null ): void => {
		if (!settlement) { return; }

		const writingPlaceElements = queryPath(teiHeader, 'profiledesc > correspdesc > correspaction[1] > placename > settlement');

		if (writingPlaceElements.length > 0) {
			writingPlaceElements[0].textContent = settlement.entityName || '';
			writingPlaceElements[0].setAttribute('data-key', settlement.entityKey || '');
		}

		const countryElements = queryPath(teiHeader, 'profiledesc > correspdesc > correspaction[1] > placename > country');

		if (countryElements.length > 0) {
			countryElements[0].textContent = settlement.entityPlaceCountryName || '';
		}
	},
	extractReceivingPlace : (teiHeader: Element | null) : { name: string | null, key: string | null } => {
		if (!teiHeader) { return { name: null, key: null }; }

		const receivingPlaceElements = queryPath(teiHeader, 'profiledesc > correspdesc > correspaction[2] > placename > settlement');
		if (receivingPlaceElements.length > 0) {
			const receivingPlace = receivingPlaceElements[0].textContent?.trim();
			return { name: receivingPlace || null, key: receivingPlaceElements[0].getAttribute('data-key') || null };
		}

		return { name: null, key: null };
	},
	setReceivingPlace: (teiHeader: Element, settlement: SnippetEntity | null ): void => {
		if (!settlement) { return; }

		const receivingPlaceElements = queryPath(teiHeader, 'profiledesc > correspdesc > correspaction[2] > placename > settlement');

		if (receivingPlaceElements.length > 0) {
			receivingPlaceElements[0].textContent = settlement.entityName || '';
			receivingPlaceElements[0].setAttribute('data-key', settlement.entityKey || '');
		}

		const countryElements = queryPath(teiHeader, 'profiledesc > correspdesc > correspaction[2] > placename > country');
		if (countryElements.length > 0) {
			countryElements[0].textContent = settlement.entityPlaceCountryName || '';
		}

	},
	extractReceiver: (teiHeader: Element | null): { name: string | null, key: string | null } => {
		if( !teiHeader) { throw new Error("No teiHeader given for extracting receiver"); }

		const receiverElements = queryPath(teiHeader, 'profiledesc > correspdesc > correspaction[2] > persname');
		if (receiverElements.length > 0) {
			const receiverName = receiverElements[0].textContent?.trim();
			return { name: receiverName || null, key: receiverElements[0].getAttribute('data-key') || null };
		}

		return { name: null, key: null };
	},
	setReceiver: (teiHeader: Element, receiver: SnippetEntity | null): void => {
		const receiverStart = queryPath(teiHeader, 'profiledesc > correspdesc > correspaction[2]')[0];

		if (receiverStart && receiver) {

			for( const child of receiverStart.childNodes) {
				if (child.nodeType === Node.ELEMENT_NODE && (child as Element).nodeName === 'persname') {
					receiverStart.removeChild(child);
				}
			}

			const receiverNode = document.createElementNS(TEI_NS, "persname");
			receiverNode.setAttribute("data-key", receiver.entityKey);
			receiverNode.setAttribute("resp", "receiver");
			receiverNode.textContent = receiver.entityName || '';

			receiverStart.insertBefore(receiverNode, receiverStart.firstChild);

		}
	},
	extractLanguages: (teiHeader: Element | null): LanguageOption[] => {
		if (!teiHeader) { return [] }

		const languageElements = queryPath(teiHeader, 'profiledesc > langusage > language');
		const letterLanguages: LanguageOption[] = [];

		if (languageElements.length === 0) { return letterLanguages; }

		languageElements.forEach(el => {
			const langCode = el.getAttribute('ident')
			if (langCode) {
				const lang = EditorConstants.LANGUAGES.find(l => l.value === langCode)

				if (lang) {
					letterLanguages.push(lang);
				}
			}
		});

		return letterLanguages;
	},
	setLanguages: (teiHeader: Element, languages: LanguageOption[]): void => {
		if (!teiHeader) return;

		const langUsageWrapper = queryPath(teiHeader, "profiledesc > langusage")[0];
		if (!langUsageWrapper) return;

		// Remove old <language> children
		for (const el of Array.from(langUsageWrapper.childNodes)) {
			if (
				el.nodeType === Node.ELEMENT_NODE &&
				(el as Element).tagName.toLowerCase() === "language"
			) {
				langUsageWrapper.removeChild(el);
			}
		}

		// Add new <language> elements
		for (const lang of languages) {
			const langElement = document.createElementNS(TEI_NS, "language");
			langElement.setAttribute("ident", lang.value);
			langElement.textContent = lang.label;
			langUsageWrapper.appendChild(langElement);
		}
	}
}
