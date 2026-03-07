import { useState } from "react";
import { useForm } from "react-hook-form";
import { Mail, MapPin, Globe, Send, Loader2, CheckCircle2 } from "lucide-react";

import axiosClient from "../../api/axios";
import { useFlash } from "../../context/FlashContext";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";

// ── tiny helpers ─────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(" ");

const Textarea = ({ className, ...props }) => (
  <textarea
    data-slot="input"
    className={cn(
      "file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:opacity-50 md:text-sm",
      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
      "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
      className,
    )}
    {...props}
  />
);

const FieldError = ({ message }) =>
  message ? <p className="mt-1 text-sm text-red-500">{message}</p> : null;

// ── component ─────────────────────────────────────────────────────────────────

export function Contact({ className, ...props }) {
  const [submitted, setSubmitted] = useState(false);
  const { flash } = useFlash();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: "", email: "", message: "" } });

  const onSubmit = async (values) => {
    try {
      await axiosClient.post("/contact", values);
      setSubmitted(true);
      flash("Message envoyé avec succès !", "success");
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data ?? {};

      if (status === 422 && data.errors) {
        // Map server-side field errors back to the form
        Object.entries(data.errors).forEach(([field, msg]) =>
          setError(field, { message: msg }),
        );
        flash("Veuillez corriger les erreurs dans le formulaire.", "error");
      } else {
        flash(
          data.msg || "Une erreur est survenue. Réessayez plus tard.",
          "error"
        );
      }
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row gap-8 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto",
        className,
      )}
      {...props}
    >
      {/* ── Coordonnées ────────────────────────────────────────────────── */}
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

      {/* ── Formulaire ─────────────────────────────────────────────────── */}
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
            {/* ── Success state ─────────────────────────────────────── */}
            {submitted ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-800">
                  Message bien reçu !
                </h3>
                <p className="text-gray-500 max-w-sm">
                  Merci de nous avoir contactés. Notre équipe vous répondra dans
                  les plus brefs délais à l&apos;adresse indiquée.
                </p>
                <Button
                  variant="outline"
                  className="mt-2 text-sky-700 border-sky-300 hover:bg-sky-50"
                  onClick={() => setSubmitted(false)}
                >
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              /* ── Form ──────────────────────────────────────────────── */
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nom et Prénom <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="contact-name"
                      placeholder="Entrez votre nom complet..."
                      aria-invalid={!!errors.name}
                      className={cn(
                        "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 transition-colors",
                        "focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-400",
                        errors.name &&
                          "border-red-400 focus:border-red-500 focus:ring-red-100",
                      )}
                      {...register("name", {
                        required: "Le nom est requis.",
                        minLength: {
                          value: 2,
                          message: "Minimum 2 caractères.",
                        },
                      })}
                    />
                    <FieldError message={errors.name?.message} />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="votre.email@domaine.com"
                      aria-invalid={!!errors.email}
                      className={cn(
                        "bg-white border-gray-300 h-11 text-gray-900 rounded-lg pl-5 transition-colors",
                        "focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-400",
                        errors.email &&
                          "border-red-400 focus:border-red-500 focus:ring-red-100",
                      )}
                      {...register("email", {
                        required: "L'email est requis.",
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Adresse email invalide.",
                        },
                      })}
                    />
                    <FieldError message={errors.email?.message} />
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Message <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="contact-message"
                      placeholder="Écrivez votre question ou commentaire ici..."
                      rows={5}
                      aria-invalid={!!errors.message}
                      className={cn(
                        "bg-white border-gray-300 text-gray-900 rounded-lg p-3 transition-colors",
                        "focus:border-sky-600 focus:ring-1 focus:ring-sky-200 hover:border-sky-400",
                        errors.message &&
                          "border-red-400 focus:border-red-500 focus:ring-red-100",
                      )}
                      {...register("message", {
                        required: "Le message est requis.",
                        minLength: {
                          value: 10,
                          message:
                            "Le message doit contenir au moins 10 caractères.",
                        },
                      })}
                    />
                    <FieldError message={errors.message?.message} />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Contact;
