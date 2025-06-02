# **App Name**: WOAV Lite

## Core Features:

- Authentication: Users sign in using Google login. On first sign-in, a profile is created in Firestore in the `users` collection with `uuid`, `username`, `profile_name`, and `profile_picture`.
- Discovery Page: Display published collections and links. Private collections are hidden unless the viewer is a collaborator or super-admin.
- Search: Users can search by `users.username`, `collections.title`, `links.url`, and `links.description`.

## Style Guidelines:

- Primary color: A subdued blue (#64748B) to convey trust and organization.
- Background color: A very light gray (#F4F5F7) to provide a clean, distraction-free backdrop.
- Accent color: A gentle purple (#A382C7) for interactive elements.
- Body and headline font: 'Inter' (sans-serif) for a modern and neutral feel.
- Utilize Shadcn UI's grid and spacing utilities for a responsive layout that adapts to different screen sizes. Maintain generous spacing for readability.
- Employ simple, minimalist icons from Shadcn UI's icon library to represent common actions like saving, sharing, and editing.
- Use subtle, unobtrusive animations for transitions and loading states to provide feedback to the user without being distracting.