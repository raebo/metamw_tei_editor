import {ContentAddressEntry, EditorConstants, validParagraphClasses} from "../../constants/editor";
import {EditorUtils} from "./index";

function writeSenderAddressContainer(xmlDoc: XMLDocument): Element {
	const senderContainer = bodyAddressContainer(xmlDoc, 'SENDER');

	if (senderContainer) {
		while (senderContainer.firstChild) {
			senderContainer.removeChild(senderContainer.firstChild);
		}
		return senderContainer;
	}

	const xmlLetterBody = EditorUtils.xmlCheck.xmlLetterBody(xmlDoc)

	const newSenderContainer = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'div');
	newSenderContainer.setAttribute('type', 'sender_address');
	newSenderContainer.setAttribute("xml:id", EditorUtils.markupGeneration.generateXmlId('div'))

	const writingActs = EditorUtils.xmlCheck.queryPath(xmlLetterBody, 'div[@type="act_of_writing"]');
	const firstWritingAct = writingActs[0] ?? null;

	if (firstWritingAct) {
		xmlLetterBody.insertBefore(newSenderContainer, firstWritingAct);
	} else {
		xmlLetterBody.appendChild(newSenderContainer);
	}

	return newSenderContainer
}

function writeReceiverAddressContainer(xmlDoc: XMLDocument): Element {
	const receiverContainer = bodyAddressContainer(xmlDoc, 'RECIPIENT');
	const senderContainer = bodyAddressContainer(xmlDoc, 'SENDER');

	if (receiverContainer) {
		while (receiverContainer.firstChild) {
			receiverContainer.removeChild(receiverContainer.firstChild);
		}
		return receiverContainer;
	}

	const xmlLetterBody = EditorUtils.xmlCheck.xmlLetterBody(xmlDoc);
	const newReceiverContainer = xmlDoc.createElementNS(EditorConstants.TEI_NS, "div");
	newReceiverContainer.setAttribute("type", "address");
	newReceiverContainer.setAttribute("xml:id", EditorUtils.markupGeneration.generateXmlId('div'))

	const writingActs = EditorUtils.xmlCheck.queryPath(xmlLetterBody, 'div[@type="act_of_writing"]');
	const firstWritingAct = writingActs[0] ?? null;

	const referenceNode = senderContainer ?? firstWritingAct;
	if (referenceNode) {
		xmlLetterBody.insertBefore(newReceiverContainer, referenceNode);
	} else {
		xmlLetterBody.appendChild(newReceiverContainer);
	}

	return newReceiverContainer;
}

function bodyAddressContainer(xmlDoc: XMLDocument, addressType: 'RECIPIENT' | 'SENDER'): Element {
	return addressType === 'RECIPIENT' ?
		EditorUtils.xmlCheck.queryPath(xmlDoc, 'tei > text > body > div[@type="address"]')[0] :
		EditorUtils.xmlCheck.queryPath(xmlDoc, 'tei > text > body > div[@type="sender_address"]')[0]
}


export const miscContentCheck = {
	writeAddressEntry: (xmlDoc: XMLDocument, addressType: 'RECIPIENT' | 'SENDER', contentAddressEntry: ContentAddressEntry | null): void => {
		if (!contentAddressEntry) return;

		const addressContainer = addressType === 'RECIPIENT' ?
			writeReceiverAddressContainer(xmlDoc) :
			writeSenderAddressContainer(xmlDoc)

		if (contentAddressEntry.deleteAddress) {
			addressContainer.parentNode?.removeChild(addressContainer);
			return;
		}

		let currentNode = addressContainer;

		if (contentAddressEntry.hasHead) {
			const headElement = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'head');
			addressContainer.appendChild(headElement);
			currentNode = headElement;
		}

		if (contentAddressEntry.hasParagraph) {
			const pElement = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'p');
			if (contentAddressEntry.paragraph && validParagraphClasses.includes(contentAddressEntry.paragraph)) {
				pElement.setAttribute('style', contentAddressEntry.paragraph);
			}
			currentNode.appendChild(pElement);
			currentNode = pElement;
		}

		const addressElement = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'address');
		currentNode.appendChild(addressElement);

		contentAddressEntry.addrLines.forEach((addrLine) => {
			const addrLineElement = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'addrLine');
			if (addrLine.rendType && addrLine.rendType.length > 0) {
				const hiElement = xmlDoc.createElementNS(EditorConstants.TEI_NS, 'hi');
				hiElement.setAttribute('rend', addrLine.rendType);
				hiElement.textContent = addrLine.content;
				addrLineElement.appendChild(hiElement);
			} else {
				addrLineElement.textContent = addrLine.content;
			}
			addressElement.appendChild(addrLineElement);
		})
	},
	existingAddressEntry: (xmlDoc: XMLDocument, addressType: 'RECIPIENT' | 'SENDER'): ContentAddressEntry => {
		const addressContainer = bodyAddressContainer(xmlDoc, addressType);

		let addrLinesMarkup = null;
		let contentAddressEntry: ContentAddressEntry = {
			isNewEntry: true,
			deleteAddress: false,
			type: addressType,
			hasHead: false,
			hasParagraph: false,
			paragraph: null,
			addrLines: []
		} as ContentAddressEntry;

		if (!addressContainer) return contentAddressEntry

		contentAddressEntry.isNewEntry = false;

		const headMarkup = EditorUtils.xmlCheck.queryPath(addressContainer, 'head')[0];
		if (headMarkup) {
			contentAddressEntry.hasHead = true;
			addrLinesMarkup = EditorUtils.xmlCheck.queryPath(addressContainer, 'head > address > addrLine');
		}

		const pMarkup = EditorUtils.xmlCheck.queryPath(addressContainer, 'p')[0];
		if (pMarkup) {
			contentAddressEntry.hasHead = false;
			contentAddressEntry.hasParagraph = true
			const style = pMarkup.getAttribute('style');

			if (style && ['PARAGRAPH_LEFT', 'PARAGRAPH_RIGHT', 'PARAGRAPH_CENTER'].includes(style)) {
				contentAddressEntry.paragraph = style.toUpperCase() as 'PARAGRAPH_LEFT' | 'PARAGRAPH_RIGHT' | 'PARAGRAPH_CENTER';
			}
			addrLinesMarkup = EditorUtils.xmlCheck.queryPath(addressContainer, 'p > address > addrLine');
		}

		if (!addrLinesMarkup || !addrLinesMarkup.length) return contentAddressEntry;

		addrLinesMarkup.map((addrLine) => {
			const hiChild = Array.from(addrLine.children).find(child => child.nodeName === 'hi')

			if (hiChild) {
				const rendAttr = hiChild.getAttribute('rend');
				if (rendAttr) {
					contentAddressEntry.addrLines.push({
						hasHighlight: true,
						content: hiChild.textContent?.trim() || '',
						rendType: rendAttr.toLowerCase(),
					});
					return; // Skip further processing for this addrLine
				} else {
					contentAddressEntry.addrLines.push({
						hasHighlight: false,
						content: hiChild.textContent?.trim() || '',
						rendType: null
					});
					return; // Skip further processing for this addrLine
				}
			} else {
				contentAddressEntry.addrLines.push({
					hasHighlight: false,
					content: addrLine.textContent?.trim() || '',
					rendType: null
				})
			}
		})

		return contentAddressEntry
	},
}
