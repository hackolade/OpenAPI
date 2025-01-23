const commentFlags = {
	inner: {
		start: 'hackoladeInnerCommentStart',
		end: 'hackoladeInnerCommentEnd',
	},
	outer: {
		start: 'hackoladeCommentStart',
		end: 'hackoladeCommentEnd',
	},
};

function commentDeactivatedItem(item, isActivated, isParentActivated, commentFlagNames) {
	if (!item || !isParentActivated) {
		return item;
	}

	if (isActivated === false) {
		return {
			[commentFlagNames.start]: true,
			...item,
			[commentFlagNames.end]: true,
		};
	}

	return item;
}

function commentDeactivatedItemInner(item, isActivated, isParentActivated) {
	return commentDeactivatedItem(item, isActivated, isParentActivated, commentFlags.inner);
}

function commentDeactivatedItemOuter(item, isActivated, isParentActivated) {
	return commentDeactivatedItem(item, isActivated, isParentActivated, commentFlags.outer);
}

const addCommentsSigns = (string, format) => {
	const commentsStart = /hackoladeCommentStart\d+/i;
	const commentsEnd = /hackoladeCommentEnd\d+/i;
	const innerCommentStart = /hackoladeInnerCommentStart/i;
	const innerCommentEnd = /hackoladeInnerCommentEnd/i;
	const innerCommentStartYamlArrayItem = /- hackoladeInnerCommentStart/i;

	const { result } = string.split('\n').reduce(
		({ isCommented, result }, line, index, array) => {
			if (commentsStart.test(line) || innerCommentStart.test(line)) {
				if (innerCommentStartYamlArrayItem.test(line)) {
					const lineBeginsAt = array[index + 1].search(/\S/);
					array[index + 1] =
						array[index + 1].slice(0, lineBeginsAt) + '- ' + array[index + 1].slice(lineBeginsAt);
				}
				return { isCommented: true, result: result };
			}
			if (commentsEnd.test(line)) {
				return { isCommented: false, result };
			}
			if (innerCommentEnd.test(line)) {
				if (format === 'json') {
					array[index + 1] = '# ' + array[index + 1];
				}
				return { isCommented: false, result };
			}

			const isNextLineInnerCommentStart = index + 1 < array.length && innerCommentStart.test(array[index + 1]);
			if (
				(isCommented || isNextLineInnerCommentStart) &&
				!innerCommentStartYamlArrayItem.test(array[index + 1])
			) {
				result = result + '# ' + line + '\n';
			} else {
				result = result + line + '\n';
			}

			return { isCommented, result };
		},
		{ isCommented: false, result: '' },
	);

	return result;
};

const removeCommentLines = scriptString => {
	const isCommentedLine = /^\s*#\s+/i;

	return scriptString
		.split('\n')
		.filter(line => !isCommentedLine.test(line))
		.join('\n')
		.replace(/(.*?),\s*(\}|])/g, '$1$2');
};

module.exports = {
	commentFlags,
	commentDeactivatedItemInner,
	commentDeactivatedItemOuter,
	addCommentsSigns,
	removeCommentLines,
};
