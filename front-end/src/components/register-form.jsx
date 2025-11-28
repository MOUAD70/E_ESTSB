import { cn } from "../lib/chadcn/utils";
import { LOGIN_ROUTE } from "../routes/Routes.jsx";
import { Button } from "./ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card.jsx";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "./ui/field.jsx";
import { Input } from "./ui/input.jsx";
import { Link } from "react-router-dom";

export function RegisterForm({ className, ...props }) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Créer un compte</CardTitle>
          <CardDescription>
            Inscrivez-vous avec votre Nom, Email et Mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nom</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Entrez votre nom..."
                  className={cn(
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                  )}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Entrez votre email..."
                  className={cn(
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                  )}
                />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Entrez votre mot de passe..."
                  className={cn(
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                  )}
                />
              </Field>

              <Field>
                <Button type="submit">Créer un compte</Button>
                <FieldDescription className="text-center">
                  Vous avez déjà un compte ?{" "}
                  <Link to={LOGIN_ROUTE}>Se connecter</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
