
const getExtensions = require('./extensionsHelper');

function getInfo({ description, version, modelVersion, title = '', termsOfService, contact, license, infoExtensions }) {
	const info = {
		title,
		description,
		termsOfService,
		contact: getContact(contact),
		license: getLicense(license),
		version: version || modelVersion
	};

	const extensions = getExtensions(infoExtensions);
	return Object.assign({}, info, extensions);
}

function getContact(contact) {
	if (!contact) {
		return;
	}

	const contactObj = {
		name: contact.contactName,
		url: contact.contactURL,
		email: contact.contactemail
	};
	const extensions = getExtensions(contact.contactExtensions);

	return Object.assign({}, contactObj, extensions);
}

function getLicense(license) {
	if (!license) {
		return;
	}

	const licenseObject = {
		name: license.licenseName,
		url: license.licenseURL
	};
	const extensions = getExtensions(license.contactExtensions);

	return Object.assign({}, licenseObject, extensions);
}

module.exports = getInfo;
