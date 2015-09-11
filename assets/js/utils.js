function hasLocalStorage() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}

module.exports = {
	hasLocalStorage: hasLocalStorage,
}