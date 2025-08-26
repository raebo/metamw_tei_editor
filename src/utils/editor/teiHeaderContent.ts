import {EditorConstants, HeaderPerson, LanguageOption} from "../../constants/editor";
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
	extractTeiHeader: (xmlDoc: Document): Element => {
		const teiHeader = xmlDoc.getElementsByTagNameNS(TEI_NS, "teiHeader")[0];

		if (!teiHeader) throw new Error("<teiHeader> not found");

		return teiHeader
	},
	titleElementHeadlines : (teiHeader: Element | null): { firstHeadline: string | null, sndHeadline: string | null } => {
		if (!teiHeader) {
			return { firstHeadline: null, sndHeadline: null };
		}

		let textBeforeLb = "";
		let textAfterLb = "";
		let foundLb = false;

		const titles = queryPath(teiHeader, "fileDesc > titleStmt > title")
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
		const titles = queryPath(teiHeader, "fileDesc > titleStmt > title");
		const children = Array.from(titles[0].childNodes);
		let foundLb = false

		children.forEach(node => {
			if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "lb") {
				foundLb = true;
			} else if (node.nodeType === Node.TEXT_NODE) {
				if (!foundLb) {
					node.textContent = firstHeadline
				} else {
					node.textContent = sndHeadline
				}
			}
		})
	},
	setPrevNextLetter : (teiHeader: Element, titleType: 'precursor' | 'successor', letterType: 'unknown' | 'not_identified' | 'select' | null, editorLetter: EditorLetter | null): void => {
		const titles = queryPath(teiHeader, `fileDesc > titleStmt > title[@type='${titleType}']`)

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
			return { title: null, name: null, letterPrefix: null, letterStatus: null };
		}

		const titles = queryPath(teiHeader, `fileDesc > titleStmt > title[@type='${titleType}']`)

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

		const writingPlaceElements = queryPath(teiHeader, 'profileDesc > correspDesc > correspAction[1] > placeName > settlement');
		if (writingPlaceElements.length > 0) {
			const writingPlace = writingPlaceElements[0].textContent?.trim();
			return { name: writingPlace || null , key: writingPlaceElements[0].getAttribute('data-key') || null };
		}

		return { name: null, key: null };
	},
	setWritingPlace: (teiHeader: Element, settlement: SnippetEntity | null ): void => {
		if (!settlement) { return; }

		const writingPlaceElements = queryPath(teiHeader, 'profileDesc > correspDesc > correspAction[1] > placeName > settlement');

		if (writingPlaceElements.length > 0) {
			writingPlaceElements[0].textContent = settlement.entityName || '';
			writingPlaceElements[0].setAttribute('data-key', settlement.entityKey || '');
		}

		const countryElements = queryPath(teiHeader, 'profileDesc > correspDesc > correspAction[1] > placeName > country');

		if (countryElements.length > 0) {
			countryElements[0].textContent = settlement.entityPlaceCountryName || '';
		}
	},
	extractReceivingPlace : (teiHeader: Element | null) : { name: string | null, key: string | null } => {
		if (!teiHeader) { return { name: null, key: null }; }

		const receivingPlaceElements = queryPath(teiHeader, 'profileDesc > correspDesc > correspAction[2] > placeName > settlement');
		if (receivingPlaceElements.length > 0) {
			const receivingPlace = receivingPlaceElements[0].textContent?.trim();
			return { name: receivingPlace || null, key: receivingPlaceElements[0].getAttribute('data-key') || null };
		}

		return { name: null, key: null };
	},
	setReceivingPlace: (teiHeader: Element, settlement: SnippetEntity | null ): void => {
		if (!settlement) { return; }

		const receivingPlaceElements = queryPath(teiHeader, 'profileDesc > correspDesc > correspAction[2] > placeName > settlement');

		if (receivingPlaceElements.length > 0) {
			receivingPlaceElements[0].textContent = settlement.entityName || '';
			receivingPlaceElements[0].setAttribute('data-key', settlement.entityKey || '');
		}

		const countryElements = queryPath(teiHeader, 'profileDesc > correspDesc > correspAction[2] > placeName > country');
		if (countryElements.length > 0) {
			countryElements[0].textContent = settlement.entityPlaceCountryName || '';
		}

	},
	extractReceiver: (teiHeader: Element | null): { name: string | null, key: string | null } => {
		if( !teiHeader) {
			return { name: null, key: null }; }

		const receiverElements = queryPath(teiHeader, 'profileDesc > correspDesc > correspAction[2] > persName');
		if (receiverElements.length > 0) {
			const receiverName = receiverElements[0].textContent?.trim();
			return { name: receiverName || null, key: receiverElements[0].getAttribute('data-key') || null };
		}

		return { name: null, key: null };
	},
	extractReceivers: (teiHeader: Element | null): HeaderPerson[] => {
		if( !teiHeader) { return []  }

		const receivers: HeaderPerson[] = [];

		const receiverElements = queryPath(teiHeader, 'profileDesc > correspDesc > correspAction[2] > persName');

		receiverElements.forEach(receiver => {
			const name = receiver.textContent?.trim() || '';
			const dataKey = receiver.getAttribute('data-key') || '';

			if (name && dataKey) {
				receivers.push({ name, key: dataKey });
			}
		})

		return receivers
	},
	extractAuthorWriters: (teiHeader: Element | null): { authors: HeaderPerson[], writers: HeaderPerson[] } => {
		if( !teiHeader) { return { authors: [], writers: [] }; }

		const autors: HeaderPerson[] = [];
		const writer: HeaderPerson[] = [];

		const correspAction = queryPath(teiHeader, 'profileDesc > correspDesc > correspAction[1]')[0];

		const writerAuthorElements = Array.from(correspAction.children).filter(el =>
			el.tagName === 'persName')

		if (writerAuthorElements.length > 0) {
			writerAuthorElements.forEach(el => {
				const resp = el.getAttribute('resp');
				const dataKey = el.getAttribute('data-key');
				const name = el.textContent?.trim() || '';

				if (resp === 'author' && dataKey) {
					autors.push({ name: name, key: dataKey });
				} else if (resp === 'writer' && dataKey) {
					writer.push({ name: name, key: dataKey });
				}
			});
		}

		return { authors: autors, writers: writer };
	},
	setAuthorWritersFirstPosition: (teiHeader: Element, authors: HeaderPerson[], writers: HeaderPerson[]): void => {
		const doc = teiHeader.ownerDocument;
		const titleStmt = teiHeader.querySelector("titleStmt");
		if (!titleStmt) {
			throw new Error("Unable to set author/writer - no <titleStmt> found");
		}

		const firstRespStmt = titleStmt.querySelector("respStmt");
		if (!firstRespStmt) {
			throw new Error(`Unable to set author stmt for ${titleStmt} - no <respStmt> found`);
		}
		let writerResp = firstRespStmt.querySelector("resp");
		const insertBeforeNode = firstRespStmt || null;

		if (!writerResp) {
			writerResp = doc.createElement("resp");
			writerResp.textContent = "writer";
			firstRespStmt.appendChild(writerResp);
		}

		Array.from(titleStmt.querySelectorAll("author")).forEach(node =>
			node.remove()
		);

		Array.from(titleStmt.querySelectorAll("respStmt > persName")).forEach(node =>
			node.remove()
		);

		authors.forEach(a => {
			const authorEl = doc.createElement("author");
			authorEl.setAttribute("key", a.key);
			authorEl.setAttribute("resp", "author");
			authorEl.textContent = a.name;

			titleStmt.insertBefore(authorEl, insertBeforeNode);
		});

		writers.forEach(w => {
			const persNameEl = doc.createElement("persName");
			persNameEl.setAttribute("key", w.key);
			persNameEl.setAttribute("resp", "writer");
			persNameEl.textContent = w.name;
			writerResp.parentNode!.appendChild(persNameEl);
		});

	},
	setAuthorsWritersSndPosition: (teiHeader: Element, authors: HeaderPerson[], writers: HeaderPerson[]): void => {
		const doc = teiHeader.ownerDocument as unknown as XMLDocument;
		const sndAuthorsWriters = queryPath(teiHeader, 'profileDesc > correspDesc > correspAction[1]')[0];

		Array.from(sndAuthorsWriters.childNodes).forEach(node => {
			if (node.nodeType === Node.ELEMENT_NODE && (node as Element).nodeName === 'persName') {
				sndAuthorsWriters.removeChild(node);
			}
		})

		authors.forEach(a => {
			const authorEl = doc.createElement("persName");
			authorEl.setAttribute("key", a.key);
			authorEl.setAttribute("resp", "author");
			const textNode = doc.createTextNode(a.name);
			authorEl.appendChild(textNode);
			sndAuthorsWriters.appendChild(authorEl);
		});

		writers.forEach(a => {
			const writerEl = doc.createElement("persName");
			writerEl.setAttribute("key", a.key);
			writerEl.setAttribute("resp", "writer");

			const textNode = doc.createTextNode(a.name);
			writerEl.appendChild(textNode);
			sndAuthorsWriters.appendChild(writerEl);
		});
	},
	setReceivers: (teiHeader: Element, receivers: HeaderPerson[]): void => {
		const receiverStart = queryPath(teiHeader, 'profileDesc > correspDesc > correspAction[2]')[0];

		if (!receiverStart) {
			return
		}

		Array.from(receiverStart.childNodes)
			.filter(node => node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'persName')
			.map(node => receiverStart.removeChild(node));

		const placeNameNode = Array.from(receiverStart.childNodes).find(node => node.nodeName === 'placeName');

		receivers.forEach(r => {
			const receiverNode = document.createElementNS(TEI_NS, "persName");
			receiverNode.setAttribute("data-key", r.key);
			receiverNode.setAttribute("resp", "receiver");
			receiverNode.textContent = r.name || '';

			if (placeNameNode) {
				receiverStart.insertBefore(receiverNode, placeNameNode);
			} else {
				receiverStart.insertBefore(receiverNode, receiverStart.firstChild);
			}
		});
	},
	extractLanguages: (teiHeader: Element | null): LanguageOption[] => {
		if (!teiHeader) { return [] }

		const languageElements = queryPath(teiHeader, 'profileDesc > langUsage > language');
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

		const langUsageWrapper = queryPath(teiHeader, "profileDesc > langUsage")[0];
		if (!langUsageWrapper) return;

		for (const el of Array.from(langUsageWrapper.childNodes)) {
			if (
				el.nodeType === Node.ELEMENT_NODE &&
				(el as Element).tagName.toLowerCase() === "language"
			) {
				langUsageWrapper.removeChild(el);
			}
		}

		for (const lang of languages) {
			const langElement = document.createElementNS(TEI_NS, "language");
			langElement.setAttribute("ident", lang.value);
			langElement.textContent = lang.label;
			langUsageWrapper.appendChild(langElement);
		}
	},
	extractEditorTranskriptorName: (teiHeader: Element | null, respStmtType: string): { name: string | null } => {
		let name = null;

		if (!teiHeader) {
			return { name: name }
		}

		const elements = queryPath(teiHeader, `fileDesc > titleStmt > respStmt[@resp=\'${respStmtType}\'] > name`);

		if (elements.length > 1) {
			name = elements[elements.length-1].textContent?.trim() || null;
		}

		return { name: name };
	},
	setEditorTranskriptorName: (teiHeader: Element | null, respStmtType: string, newName: string | null): void => {
		if (!teiHeader || !newName) {
			return;
		}

		const elements = queryPath(teiHeader, `fileDesc > titleStmt > respStmt[@resp=\'${respStmtType}\'] > name`);

		const lastElement = elements[elements.length-1];

		if (elements.length > 1) {
			lastElement.textContent = newName;
		} else {
			const nameNode = document.createElementNS(TEI_NS, "name");
			nameNode.setAttribute("resp", respStmtType);
			nameNode.textContent = newName;
			lastElement.parentElement?.appendChild(nameNode);
		}

	}
}
