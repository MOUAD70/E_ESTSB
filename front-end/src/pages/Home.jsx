import { CopyCheck, Goal, Swords } from "lucide-react";
import ESTSB_LOGO from "../assets/images/ESTSB-LOGO.png"

const Home = () => {
  return (
    <div className="px-4 sm:px-6 md:px-10 lg:px-16 py-6 sm:py-8 md:py-10">
      <div className="flex items-center justify-between mb-15">
        <div className="text-4xl text-center sm:text-4xl  md:text-4xl font-bold text-black flex-1 min-w-0">
          Plateforme de gestion des Concours – ESTSB
        </div>

        <div className="hidden sm:block text-3xl font-bold mt-4 sm:mt-0 ml-4">
          <img
            src={ESTSB_LOGO}
            className="w-32 sm:w-40 md:w-48"
            alt="ESTSB Logo"
          />
        </div>
      </div>

      <div className="mt-10 text-gray-800 text-center text-base sm:text-lg leading-relaxed max-w-3xl">
        <p className="font-bold text-sky-800">
          Bienvenue dans l'ère du E-Concours à l'EST Sidi Bennour !
        </p>{" "}
        Oubliez la complexité administrative. Cette plateforme est votre portail
        d'accès unique vers un processus de sélection entièrement digitalisé,
        conçu pour vous offrir une expérience fluide et transparente, et
        garantir à l'administration une gestion optimisée, rapide et sereine.
      </div>

      <div className="mt-10">
        <h2 className="flex text-xl font-semibold text-sky-600 mb-3">
          <Goal className="mr-2" />
          Notre vision : Pourquoi cette plateforme est-elle nécessaire ?
        </h2>
        <p className="text-gray-800 text-base sm:text-lg leading-relaxed">
          Notre mission est claire :{" "}
          <span className="font-bold">
            structurer et simplifier l'accès à l'enseignement supérieur
          </span>
          . Nous avons bâti cette solution pour remplacer les processus manuels
          et dispersés par un écosystème unique. Le but est de regrouper
          l'intégralité du cycle de concours – de l'inscription à l'évaluation
          des dossiers jusqu'au classement final – au sein d'un outil fiable,
          intuitif et facile d'accès pour tous.
        </p>
      </div>

      <div className="mt-10">
        <h2 className="flex text-xl font-semibold text-sky-600 mb-3">
          <Swords className="mr-2" />
          Le défi : Quel problème majeur résolvons-nous ?
        </h2>
        <p className="text-gray-800 text-base sm:text-lg leading-relaxed">
          La gestion traditionnelle des concours est souvent synonyme de{" "}
          <span className="font-bold">
            délais, d'erreurs potentielles et de stress inutile. <br />
          </span>{" "}
          Nous agissons directement contre ces frictions : finies les
          inscriptions papier interminables, le risque d'erreurs accru, la
          complexité du classement manuel, et le manque de visibilité pour les
          candidats. <br /> Notre plateforme apporte structure, rapidité et une
          clarté totale à chaque étape du processus.
        </p>
      </div>

      <div className="mt-10">
        <h2 className="flex text-xl font-semibold text-sky-600 mb-3">
          <CopyCheck className="mr-2" />
          Notre avantage : Digitalisation, Équité et Intelligence Artificielle
        </h2>
        <p className="text-gray-800 text-base sm:text-lg leading-relaxed">
          La <span className="font-bold">digitalisation </span> pose les bases
          de la performance : centralisation 24/7, accessibilité et transparence
          complète. L'intégration de l'
          <span className="font-bold">Intelligence Artificielle</span> est le
          véritable levier stratégique. Elle assure un scoring intelligent et
          impartial, une analyse approfondie des profils, et un classement final
          automatique. <br /> C'est l'assurance d'une sélection objective,
          orientée vers l'excellence académique et la réussite des futurs
          étudiants.
        </p>
      </div>

      <div className="flex items-center justify-center text-gray-600 mt-12 text-sm">
        © {new Date().getFullYear()} EST Sidi Bennour - Tous droits réservés.
      </div>
    </div>
  );
};

export default Home;
