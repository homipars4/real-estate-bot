import { Client, Databases } from "node-appwrite";

const client = new Client()
    .setEndpoint(process.env.API_ENDPOINT)
    .setProject(process.env.PROJECT_ID)
    .setKey(process.env.API_KEY);

export const databases = new Databases(client);

export async function saveUser(firstName, lastName, phoneNumber) {
    try {
        const result = await databases.createDocument(
            process.env.DATABASE_ID,
            process.env.COLLECTION_USERS_ID,
            'unique()',
            {
                firstName,
                lastName,
                phoneNumber,
                role: "user"
            }
        );
        return result;
    } catch (error) {
        console.error("Error saving user:", error);
        throw error;
    }
}
