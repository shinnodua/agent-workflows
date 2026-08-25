export function normalizeStatus(status: string) {
	return status.toLowerCase().trim() || "unknown";
}

export function displayStatus(status: string) {
	return normalizeStatus(status).replace(/-/g, " ");
}
