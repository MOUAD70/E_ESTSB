import { useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "../../../lib/chadcn/utils.js";

import { AuthContext } from "../../../context/AuthContext.jsx";
import { LOGIN_ROUTE } from "../../../routes/Routes.jsx";

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

const registerSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(20, "Le mot de passe ne peut dépasser 20 caractères"),
  cin: z.string().min(6, "CIN invalide"),
  phone_num: z
  .string()
  .regex(/^\d+$/, "Le numéro de téléphone doit contenir uniquement des chiffres")
  .min(10, "Le numéro de téléphone doit contenir au 10 chiffres")
});

export function RegisterForm({ className, ...props }) {
  const { handleRegister } = useContext(AuthContext);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      data.role = "CANDIDAT";

      await handleRegister(data);

      navigate(LOGIN_ROUTE);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Créer un compte</CardTitle>
          <CardDescription>
            Inscrivez-vous avec vos informations
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nom">Nom</FieldLabel>
                <Input
                  id="nom"
                  placeholder="Entrez votre nom..."
                  {...register("nom")}
                  className={cn(
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                  )}
                />
                {errors.nom && (
                  <FieldDescription className="text-red-500">
                    {errors.nom.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="prenom">Prénom</FieldLabel>
                <Input
                  id="prenom"
                  placeholder="Entrez votre prénom..."
                  {...register("prenom")}
                  className={cn(
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                  )}
                />
                {errors.prenom && (
                  <FieldDescription className="text-red-500">
                    {errors.prenom.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Entrez votre email..."
                  {...register("email")}
                  className={cn(
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
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
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                  )}
                />
                {errors.password && (
                  <FieldDescription className="text-red-500">
                    {errors.password.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="cin">CIN</FieldLabel>
                <Input
                  id="cin"
                  placeholder="Entrez votre CIN..."
                  {...register("cin")}
                  className={cn(
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                  )}
                />
                {errors.cin && (
                  <FieldDescription className="text-red-500">
                    {errors.cin.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="phone_num">Numéro de téléphone</FieldLabel>
                <Input
                  id="phone_num"
                  placeholder="Entrez votre numéro de téléphone..."
                  {...register("phone_num")}
                  className={cn(
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                  )}
                />
                {errors.phone_num && (
                  <FieldDescription className="text-red-500">
                    {errors.phone_num.message}
                  </FieldDescription>
                )}
              </Field>

              <Field>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Création..." : "Créer un compte"}
                </Button>

                <FieldDescription className="text-center">
                  Vous avez déjà un compte ?{" "}
                  <Link to={LOGIN_ROUTE} className="text-sky-600">
                    Se connecter
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
