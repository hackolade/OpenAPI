const resolvePath = (data, callback) => {
	let path = (data.path || '').split('/');
	if (!path[0]) {
		path = path.slice(1);
	}
	if (!path[0]) {
		return callback({
			title: 'Resolve external definition path error',
			message: 'External definition path is not valid'
		}, data.path || '');
	}
	if (path[0] === 'components' || path[0] === 'definitions') {
		return callback(null, 'definitions' + addPropertiesToPath(path.slice(1)));
	}

	const bucket = path[1];
	const request = path[2];

	if (path[3] === 'responses') {
		return callback(null, `${bucket}/${request}/${path[4]}${addPropertiesToPath(['response', ...path.slice(5)])}`);
	}

	return callback(null, `${bucket}/${request}${addPropertiesToPath(path.slice(3))}`);
};

const addPropertiesToPath = path => path.length ? '/properties/' + path.filter(item => item !== 'properties').join('/properties/') : '';

module.exports = {
	resolvePath
};
