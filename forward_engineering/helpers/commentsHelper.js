const commentFlags = {
	inner: {
		start: 'hackoladeInnerCommentStart',
		end: 'hackoladeInnerCommentEnd'
	},
	outer: {
		start: 'hackoladeCommentStart',
		end: 'hackoladeCommentEnd'
	}
};

function commentDeactivatedItem(item, isActivated, isParentActivated, commentFlagNames) {
	if (!item || !isParentActivated) {
		return item;
	}

	if (isActivated === false) {
		return {
			[commentFlagNames.start]: true,
			...item,
			[commentFlagNames.end]: true
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

module.exports = { commentFlags, commentDeactivatedItemInner, commentDeactivatedItemOuter };