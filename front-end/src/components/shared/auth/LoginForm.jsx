import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";

import { AuthContext } from "../../../context/AuthContext.jsx";
import { ADMIN_DASHBOARD_ROUTE, CANDIDAT_APLY_ROUTE, REGISTER_ROUTE } from "../../../routes/Routes.jsx";

import { cn } from "../../../lib/chadcn/utils.js";
import { Button } from "../../ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card.jsx";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../../ui/field.jsx";
import { Input } from "../../ui/input.jsx";
import { useFlash } from "../../../context/FlashContext.jsx";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L’email est requis.")
    .email("Format d’email invalide."),
  password: z
    .string()
    .min(1, "Le mot de passe est requis.")
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .max(20, "Le mot de passe ne doit pas dépasser 20 caractères."),
});

export function LoginForm({ className, ...props }) {
  const { handleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const { flash } = useFlash();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data) => {
    setErrorMsg("");
    try {
      const user = await handleLogin(data);

      if (user.role === "ADMIN") {
        flash("Logged in successfully!", "success");
        navigate(ADMIN_DASHBOARD_ROUTE);
      } else {
        flash("Logged in successfully!", "success");
        navigate(CANDIDAT_APLY_ROUTE);
      }
    } catch (err) {
      setErrorMsg(
        err.response?.data?.msg ||
          "Erreur lors de la connexion. Veuillez réessayer."
      );
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Bienvenue de nouveau</CardTitle>
          <CardDescription>
            Connectez-vous avec votre email et votre mot de passe
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Entrez votre email..."
                  {...register("email")}
                  className={cn(
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors",
                    errors.email && "border-red-500 focus:border-red-500"
                  )}
                />
                {errors.email && (
                  <FieldDescription className="text-red-500">
                    {errors.email.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Entrez votre mot de passe..."
                  {...register("password")}
                  className={cn(
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors",
                    errors.password && "border-red-500 focus:border-red-500"
                  )}
                />
                {errors.password && (
                  <FieldDescription className="text-red-500">
                    {errors.password.message}
                  </FieldDescription>
                )}
              </Field>

              {errorMsg && (
                <p className="text-red-600 text-sm -mt-2 bg-red-200 rounded-2xl px-4 py-2">
                  {errorMsg}
                </p>
              )}

              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Connexion..." : "Se connecter"}
                </Button>

                <FieldDescription className="text-center mt-4">
                  Vous n’avez pas de compte ?{" "}
                  <Link
                    to={REGISTER_ROUTE}
                    className="text-sky-600 hover:underline"
                  >
                    Créer un compte
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
