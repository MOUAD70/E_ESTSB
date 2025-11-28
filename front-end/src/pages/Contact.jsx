import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Field, FieldGroup, FieldLabel } from "../components/ui/field";
import { Input } from "../components/ui/input";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const Textarea = ({ id, placeholder, className, ...props }) => {
  return (
    <textarea
      id={id}
      placeholder={placeholder}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
};

const Mail = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const MapPin = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const Globe = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <path d="M2 12h20" />
  </svg>
);

export function Contact({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row gap-8 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto",
        className
      )}
      {...props}
    >
      <div className="lg:w-1/3 p-6 bg-sky-50 rounded-xl border border-sky-100 h-fit">
        <h3 className="text-xl text-center font-bold mb-4 text-sky-800 border-b pb-2">
          Nos Coordonnées
        </h3>

        <div className="space-y-6">
          <div className="flex items-start">
            <MapPin className="w-6 h-6 text-sky-800 shrink-0 mt-1 mr-3" />
            <div>
              <p className="font-semibold text-gray-800">Adresse Postale</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                AVENUE DES FAR B.P 180-24350 SIDI-BENNOUR - MAROC
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <Mail className="w-6 h-6 text-sky-800 shrink-0 mt-1 mr-3" />
            <div>
              <p className="font-semibold text-gray-800">Email Officiel</p>
              <a
                href="mailto:estsb@ucd.ac.ma"
                className="text-sm text-sky-600 hover:underline"
              >
                estsb@ucd.ac.ma
              </a>
            </div>
          </div>

          <div className="flex items-start">
            <Globe className="w-6 h-6 text-sky-800 shrink-0 mt-1 mr-3" />
            <div>
              <p className="font-semibold text-gray-800">Site Web</p>
              <a
                href="https://www.estsb.ucd.ac.ma/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-600 hover:underline"
              >
                http://estsb.ucd.ac.ma
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-sky-200">
          <p className="text-xs text-gray-500 italic text-center">
            Nous nous engageons à répondre dans les plus brefs délais.
          </p>
        </div>
      </div>
      <div className="lg:w-2/3">
        <Card className="border-sky-600/50">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-black">
              Contactez-nous
            </CardTitle>
            <CardDescription className="text-gray-600">
              Une question sur les concours ? Envoyez-nous un message.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Nom et Prénom</FieldLabel>
                  <Input
                    id="name"
                    placeholder="Entrez votre nom complet..."
                    className={cn(
                      "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                    )}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@domaine.com"
                    className={cn(
                      "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                    )}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="message">Message</FieldLabel>
                  <Textarea
                    id="message"
                    placeholder="Écrivez votre question ou commentaire ici..."
                    className={cn(
                      "bg-white border-gray-300 text-gray-900 rounded-lg p-3 focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-600 transition-colors"
                    )}
                    rows={4}
                    required
                  />
                </Field>

                <Field>
                  <Button type="submit" className="w-full">
                    Envoyer le message
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Contact;
