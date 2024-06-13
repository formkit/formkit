export async function canImport() {
    try {
        await import("@formkit/pro");
        return true;
    } catch (err) {
        return false;
    }
}