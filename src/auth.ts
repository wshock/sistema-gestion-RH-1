import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { verifyCredentials } from "@/services/auth.service";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // El secreto de firma de la sesión nunca vive en el código.
  secret: process.env.AUTH_SECRET,
  // Requerido por el proveedor de credenciales: la sesión viaja como JWT
  // firmado en una cookie httpOnly, no hay tabla de sesiones.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      // Devolver `null` hace que Auth.js responda siempre con el mismo error
      // (`CredentialsSignin`), sin revelar si falló el correo o la contraseña.
      authorize: (credentials) => verifyCredentials(credentials),
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});
