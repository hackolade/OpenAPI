
const getExtensions = require('./extensionsHelper');
const { isNotEmptyString } = require('./sharedHelper');

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
	const getLicenseData = (license) => {
		if (isNotEmptyString(license.licenseIdentifier)) {
			return {
				identifier: license.licenseIdentifier,
			};
		}
		if (isNotEmptyString(license.licenseURL)) {
			return {
				url: license.licenseURL
			};
		}
		return {};
	};

	if (!license) {
		return;
	}

	const extensions = getExtensions(license.contactExtensions);
	const licenseObject = {
		name: license.licenseName,
		...getLicenseData(license),
		...extensions,
	};
	return licenseObject;
}

module.exports = getInfo;
