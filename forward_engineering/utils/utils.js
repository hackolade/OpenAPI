function removeEmptyObjectFields(inputObj) {

	const obj = JSON.parse(JSON.stringify(inputObj));

	const isObjectFieldWithNotEmptyValue = key =>
		obj[key] !== null &&
		obj[key] !== undefined &&
		(typeof obj[key] === 'string' ? obj[key].length > 0 : true) &&
		(Array.isArray(obj[key]) ? obj[key].length > 0 : true);

	return Object.keys(obj)
		.filter(isObjectFieldWithNotEmptyValue)
		.reduce(
			(newObj, key) => {
				const isObjectAndNotArray = typeof obj[key] === 'object' && !Array.isArray(obj[key]);
				if (isObjectAndNotArray) {
					return Object.assign(newObj, {
						[key]: removeEmptyObjectFields(obj[key])
				  	});
				}
					return Object.assign(newObj, { [key]: obj[key] })
			},
			{}
		);
}

const prepareName = (name) => {
	return (name || '').replace(/\ /ig, '_');
};

const prepareReferenceName = (ref) => {
	const refParts = ref.split('/');
	const name = refParts.pop();
	const preparedName = prepareName(name);

	refParts.push(preparedName);

	return refParts.join('/');
};

module.exports = {
	removeEmptyObjectFields,
	prepareName,
	prepareReferenceName
};