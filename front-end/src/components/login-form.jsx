import { cn } from "../lib/chadcn/utils";
import { REGISTER_ROUTE } from "../routes/Routes.jsx";
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

export function LoginForm({ className, ...props }) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Bienvenue de nouveau</CardTitle>
          <CardDescription>
            Connectez-vous avec votre Email et votre Mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
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
                  placeholder="Entrez votre password..."
                  className={cn(
                    "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                  )}
                />
              </Field>

              <Field>
                <Button type="submit">Se connecter</Button>
                <FieldDescription className="text-center">
                  Vous n&apos;avez pas de compte ?{" "}
                  <Link to={REGISTER_ROUTE}>Créer un compte</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
