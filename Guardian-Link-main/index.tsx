/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import api, { authAPI, userAPI, contactsAPI, companionAPI, sosAPI, historyAPI, storage } from './api';

// AI Distress Detection Imports
import { DistressDetectionManager } from './src/distress-detection/services/DistressDetectionManager';
import { VerificationDialog } from './src/distress-detection/components/VerificationDialog';
import { PermissionsManager } from './src/distress-detection/services/PermissionsManager';

// 1. --- LOCALIZATION SETUP ---
const translations = {
    en: {
        appName: "GuardianLink",
        login: {
            signIn: "Sign In",
            createAccount: "Create an Account",
            subtext: "Secure your world with one tap.",
            footer: "By signing in you accept our <terms>Terms of use</terms> and <privacy>Privacy policy</privacy>."
        },
        auth: {
            email: "Email",
            password: "Password",
            fullName: "Full Name",
            confirmPassword: "Confirm Password",
            signInGoogle: "Sign In with Google",
            signInApple: "Sign In with Apple",
            signUpGoogle: "Sign Up with Google",
            signUpApple: "Sign Up with Apple",
            or: "OR",
            forgotPassword: "Forgot Password?",
            noAccount: "Don’t have an account?",
            createOne: "Create one",
            hasAccount: "Already have an account?",
            signInHere: "Sign In",
            passwordValidationError: "Passwords do not match.",
            signInFailed: "Sign in failed. Please check your credentials.",
            passReq: {
                title: "Password must contain:",
                length: "At least 8 characters",
                uppercase: "One uppercase letter",
                number: "One number",
                symbol: "One symbol (!@#$...)"
            }
        },
        companionModal: {
            title: "Start Companion Mode",
            close: "Close",
            description: "Share your live location with selected contacts. No emergency alerts will be sent.",
            shareWith: "Share with:",
            noContacts: "Please add an emergency contact first.",
            duration: "Duration:",
            minutes: "min",
            hour: "hr",
            cancel: "Cancel",
            startSharing: "Start Sharing",
            alertNoContact: "Please select at least one contact to share your location with."
        },
        home: {
            elderlyMode: "Elderly Mode",
            sos: "SOS",
            cancel: "CANCEL",
            statusSafe: "You're Safe",
            statusActive: "EMERGENCY ACTIVE",
            companionMode: "Companion Mode",
            status: "Status:",
            active: "Active",
            inactive: "Inactive",
            sharingWith: "Sharing location with:",
            mapLoading: "Loading map...",
            stopSharing: "Stop Sharing",
            markSafe: "Mark Me as Safe",
            slideToShareLocation: "Slide to Share Location",
            safewordPrompt: "Enter your safeword to deactivate SOS",
            safewordPlaceholder: "Safeword",
            confirmSafe: "Confirm Safe",
            incorrectSafeword: "Incorrect safeword. Please try again.",
            safewordRequired: "Safeword is required to deactivate SOS.",
            yourLocation: "Your Location",
            tapToExpand: "Tap to expand",
            gettingLocation: "Getting location...",
            back: "Back",
            coordinates: "Coordinates"
        },
        contacts: {
            title: "Emergency Contacts",
            description: "Manage the people who will be notified in an emergency.",
            addContact: "Add Contact",
            contactNum: "Contact #",
            remove: "Remove Contact",
            fullName: "Full Name",
            phone: "Phone Number",
            email: "Email Address"
        },
        history: {
            title: "Alert History",
            description: "Recent alerts and activity logs will be shown here.",
            noHistory: "No alert history yet"
        },
        camera: {
            error: "Could not access the camera. Please check permissions.",
            cancel: "Cancel",
            capture: "Capture"
        },
        shareModal: {
            title: "Share Profile",
            description: "Share a link to your profile with others.",
            copy: "Copy",
            copied: "Copied!",
            shareVia: "Share via...",
            error: "Web Share API is not supported in your browser."
        },
        statusModal: {
            title: "Edit Status",
            emojiLabel: "Emoji",
            textLabel: "Status",
            save: "Save",
            cancel: "Cancel"
        },
        profile: {
            settings: "Settings",
            share: "Share Profile",
            setStatus: "Set your status",
            viewPicture: "View profile picture"
        },
        settings: {
            title: "Settings",
            back: "Back",
            profile: "Profile",
            upload: "Upload",
            camera: "Camera",
            username: "Username",
            email: "Email Address",
            safeword: "Voice Activation Safeword",
            safewordPlaceholder: "e.g., 'Guardian Angel'",
            changePass: "Change Password",
            currentPass: "Current Password",
            newPass: "New Password",
            confirmPass: "Confirm New Password",
            appearance: "Appearance",
            light: "Light",
            dark: "Dark",
            automatic: "Automatic",
            language: "App Language",
            notifications: "Notifications",
            sosAlerts: "SOS Alerts",
            sosAlertsDesc: "Receive alerts for emergency situations.",
            companionUpdates: "Companion Mode Updates",
            companionUpdatesDesc: "Get notified when live tracking starts or ends.",
            statusUpdates: "Status Updates",
            statusUpdatesDesc: "Alerts for “User Marked Safe” or system activity.",
            save: "Save Settings",
            signOut: "Sign Out",
            signOutConfirm: "Are you sure you want to sign out?",
            saveSuccess: "Settings saved!",
            langChanged: "Language changed to "
        },
        nav: {
            home: "Home",
            contacts: "Contacts",
            map: "Map",
            history: "History",
            profile: "Profile"
        },
        map: { 
            title: "Live Location Map", 
            description: "View your location and active companion sessions on the map.",
            you: "You",
            companions: "Companions", 
            sosAlerts: "SOS Alerts"
        }
    },
    es: {
        appName: "GuardianLink",
        login: { signIn: "Iniciar Sesión", createAccount: "Crear Cuenta", subtext: "Asegura tu mundo con un solo toque.", footer: "Al iniciar sesión, aceptas nuestros <terms>Términos de uso</terms> y <privacy>Política de privacidad</privacy>." },
        auth: { email: "Correo Electrónico", password: "Contraseña", fullName: "Nombre Completo", confirmPassword: "Confirmar Contraseña", signInGoogle: "Iniciar Sesión con Google", signInApple: "Iniciar Sesión con Apple", signUpGoogle: "Registrarse con Google", signUpApple: "Registrarse con Apple", or: "O", forgotPassword: "¿Olvidaste tu contraseña?", noAccount: "¿No tienes una cuenta?", createOne: "Crea una", hasAccount: "¿Ya tienes una cuenta?", signInHere: "Iniciar Sesión", passwordValidationError: "Las contraseñas no coinciden.", signInFailed: "Fallo de inicio de sesión. Revisa tus credenciales.", passReq: { title: "La contraseña debe contener:", length: "Al menos 8 caracteres", uppercase: "Una letra mayúscula", number: "Un número", symbol: "Un símbolo (!@#$...)" } },
        companionModal: { title: "Iniciar Modo Compañero", close: "Cerrar", description: "Selecciona contactos para compartir tu ubicación en vivo y establece una duración.", shareWith: "Compartir con:", noContacts: "Por favor, añade un contacto de emergencia primero.", duration: "Duración:", minutes: "min", hour: "h", cancel: "Cancelar", startSharing: "Empezar a Compartir", alertNoContact: "Por favor, selecciona al menos un contacto." },
        home: { elderlyMode: "Modo Mayor", sos: "SOS", cancel: "CANCELAR", statusSafe: "Estás a Salvo", statusActive: "EMERGENCIA ACTIVA", companionMode: "Modo Compañero", status: "Estado:", active: "Activo", inactive: "Inactivo", sharingWith: "Compartiendo ubicación con:", mapLoading: "Cargando mapa...", stopSharing: "Dejar de Compartir", markSafe: "Marcar como Seguro", slideToShareLocation: "Desliza para Compartir Ubicación", safewordPrompt: "Ingresa tu palabra de seguridad para desactivar SOS", safewordPlaceholder: "Palabra de seguridad", confirmSafe: "Confirmar Seguro", incorrectSafeword: "Palabra de seguridad incorrecta. Inténtalo de nuevo.", safewordRequired: "Se requiere palabra de seguridad para desactivar SOS.", yourLocation: "Tu Ubicación", tapToExpand: "Toca para expandir", gettingLocation: "Obteniendo ubicación...", back: "Atrás", coordinates: "Coordenadas" },
        contacts: { title: "Contactos de Emergencia", description: "Administra las personas que serán notificadas en una emergencia.", addContact: "Añadir Contacto", contactNum: "Contacto #", remove: "Eliminar Contacto", fullName: "Nombre Completo", phone: "Número de Teléfono", email: "Correo Electrónico" },
        history: { title: "Historial de Alertas", description: "Las alertas y registros de actividad recientes se mostrarán aquí.", noHistory: "Aún no hay historial de alertas" },
        camera: { error: "No se pudo acceder a la cámara. Revisa los permisos.", cancel: "Cancelar", capture: "Capturar" },
        shareModal: { title: "Compartir Perfil", description: "Comparte un enlace a tu perfil con otros.", copy: "Copiar", copied: "¡Copiado!", shareVia: "Compartir vía...", error: "La API de Compartir Web no es compatible con tu navegador." },
        statusModal: { title: "Editar Estado", emojiLabel: "Emoji", textLabel: "Estado", save: "Guardar", cancel: "Cancelar" },
        profile: { settings: "Ajustes", share: "Compartir Perfil", setStatus: "Define tu estado", viewPicture: "Ver foto de perfil" },
        settings: { title: "Ajustes", back: "Atrás", profile: "Perfil", upload: "Subir", camera: "Cámara", username: "Usuario", email: "Correo Electrónico", safeword: "Palabra Clave de Activación por Voz", safewordPlaceholder: "ej. 'Ángel Guardián'", changePass: "Cambiar Contraseña", currentPass: "Contraseña Actual", newPass: "Nueva Contraseña", confirmPass: "Confirmar Nueva Contraseña", appearance: "Apariencia", light: "Claro", dark: "Oscuro", automatic: "Automático", language: "Idioma de la App", notifications: "Notificaciones", sosAlerts: "Alertas SOS", sosAlertsDesc: "Recibir alertas en situaciones de emergencia.", companionUpdates: "Actualizaciones Modo Compañero", companionUpdatesDesc: "Recibir notificaciones cuando el seguimiento en vivo comienza o termina.", statusUpdates: "Actualizaciones de Estado", statusUpdatesDesc: "Alertas para “Usuario Marcado como Seguro” o actividad del sistema.", save: "Guardar Ajustes", signOut: "Cerrar Sesión", signOutConfirm: "¿Seguro que quieres cerrar sesión?", saveSuccess: "¡Ajustes guardados!", langChanged: "Idioma cambiado a " },
        nav: { home: "Inicio", contacts: "Contactos", map: "Mapa", history: "Historial", profile: "Perfil" },
        map: { 
            title: "Mapa de Ubicación en Vivo", 
            description: "Ve tu ubicación y sesiones de compañero activas en el mapa.",
            you: "Tú",
            companions: "Compañeros", 
            sosAlerts: "Alertas SOS"
        }
    },
    fr: {
        appName: "GuardianLink",
        login: { signIn: "Se Connecter", createAccount: "Créer un Compte", subtext: "Sécurisez votre monde d'un simple toucher.", footer: "En vous connectant, vous acceptez nos <terms>Conditions d'utilisation</terms> et notre <privacy>Politique de confidentialité</privacy>." },
        auth: { email: "E-mail", password: "Mot de passe", fullName: "Nom Complet", confirmPassword: "Confirmer le mot de passe", signInGoogle: "Se connecter avec Google", signInApple: "Se connecter avec Apple", signUpGoogle: "S'inscrire avec Google", signUpApple: "S'inscrire avec Apple", or: "OU", forgotPassword: "Mot de passe oublié ?", noAccount: "Pas de compte ?", createOne: "En créer un", hasAccount: "Déjà un compte ?", signInHere: "Se connecter", passwordValidationError: "Les mots de passe ne correspondent pas.", signInFailed: "Échec de la connexion. Veuillez vérifier vos identifiants.", passReq: { title: "Le mot de passe doit contenir :", length: "Au moins 8 caractères", uppercase: "Une lettre majuscule", number: "Un chiffre", symbol: "Un symbole (!@#$...)" } },
        companionModal: { title: "Démarrer le Mode Compagnon", close: "Fermer", description: "Sélectionnez des contacts pour partager votre position en direct et définissez une durée.", shareWith: "Partager avec :", noContacts: "Veuillez d'abord ajouter un contact d'urgence.", duration: "Durée :", minutes: "min", hour: "h", cancel: "Annuler", startSharing: "Commencer le Partage", alertNoContact: "Veuillez sélectionner au moins un contact." },
        home: { elderlyMode: "Mode Senior", sos: "SOS", cancel: "ANNULER", statusSafe: "Vous êtes en Sécurité", statusActive: "URGENCE ACTIVE", companionMode: "Mode Compagnon", status: "Statut :", active: "Actif", inactive: "Inactif", sharingWith: "Partage de la position avec :", mapLoading: "Chargement de la carte...", stopSharing: "Arrêter le Partage", markSafe: "Me Marquer comme Sûr", slideToShareLocation: "Glisser pour Partager la Position", safewordPrompt: "Entrez votre mot de sécurité pour désactiver SOS", safewordPlaceholder: "Mot de sécurité", confirmSafe: "Confirmer Sûr", incorrectSafeword: "Mot de sécurité incorrect. Veuillez réessayer.", safewordRequired: "Le mot de sécurité est requis pour désactiver SOS.", yourLocation: "Votre Position", tapToExpand: "Appuyez pour agrandir", gettingLocation: "Obtention de la position...", back: "Retour", coordinates: "Coordonnées" },
        contacts: { title: "Contacts d'Urgence", description: "Gérez les personnes qui seront notifiées en cas d'urgence.", addContact: "Ajouter un Contact", contactNum: "Contact #", remove: "Supprimer le Contact", fullName: "Nom Complet", phone: "Numéro de Téléphone", email: "Adresse E-mail" },
        history: { title: "Historique des Alertes", description: "Les alertes récentes et les journaux d'activité seront affichés ici.", noHistory: "Aucun historique d'alerte pour le moment" },
        camera: { error: "Impossible d'accéder à la caméra. Veuillez vérifier les autorisations.", cancel: "Annuler", capture: "Capturer" },
        shareModal: { title: "Partager le Profil", description: "Partagez un lien vers votre profil.", copy: "Copier", copied: "Copié !", shareVia: "Partager via...", error: "L'API de partage Web n'est pas prise en charge par votre navigateur." },
        statusModal: { title: "Modifier le Statut", emojiLabel: "Emoji", textLabel: "Statut", save: "Enregistrer", cancel: "Annuler" },
        profile: { settings: "Paramètres", share: "Partager le Profil", setStatus: "Définir votre statut", viewPicture: "Voir la photo de profil" },
        settings: { title: "Paramètres", back: "Retour", profile: "Profil", upload: "Télécharger", camera: "Caméra", username: "Nom d'utilisateur", email: "Adresse E-mail", safeword: "Mot de Sécurité pour Activation Vocale", safewordPlaceholder: "ex. 'Ange Gardien'", changePass: "Changer de Mot de Passe", currentPass: "Mot de Passe Actuel", newPass: "Nouveau Mot de Passe", confirmPass: "Confirmer le Nouveau Mot de Passe", appearance: "Apparence", light: "Clair", dark: "Sombre", automatic: "Automatique", language: "Langue de l'App", notifications: "Notifications", sosAlerts: "Alertes SOS", sosAlertsDesc: "Recevoir des alertes en cas d'urgence.", companionUpdates: "Mises à Jour Mode Compagnon", companionUpdatesDesc: "Être notifié lorsque le suivi en direct commence ou se termine.", statusUpdates: "Mises à Jour de Statut", statusUpdatesDesc: "Alertes pour “Utilisateur Marqué comme Sûr” ou activité du système.", save: "Enregistrer", signOut: "Se Déconnecter", signOutConfirm: "Êtes-vous sûr de vouloir vous déconnecter ?", saveSuccess: "Paramètres enregistrés !", langChanged: "Langue changée en " },
        nav: { home: "Accueil", contacts: "Contacts", map: "Carte", history: "Historique", profile: "Profil" },
        map: { 
            title: "Carte de Localisation en Direct", 
            description: "Visualisez votre position et les sessions de compagnon actives sur la carte.",
            you: "Vous",
            companions: "Compagnons", 
            sosAlerts: "Alertes SOS"
        }
    },
    pt: {
        appName: "GuardianLink",
        login: { signIn: "Entrar", createAccount: "Criar Conta", subtext: "Proteja seu mundo com um toque.", footer: "Ao entrar, você aceita nossos <terms>Termos de Uso</terms> e <privacy>Política de Privacidade</privacy>." },
        auth: { email: "E-mail", password: "Senha", fullName: "Nome Completo", confirmPassword: "Confirmar Senha", signInGoogle: "Entrar com Google", signInApple: "Entrar com Apple", signUpGoogle: "Registrar com Google", signUpApple: "Registrar com Apple", or: "OU", forgotPassword: "Esqueceu a senha?", noAccount: "Não tem uma conta?", createOne: "Crie uma", hasAccount: "Já tem uma conta?", signInHere: "Entrar", passwordValidationError: "As senhas não correspondem.", signInFailed: "Falha ao entrar. Verifique suas credenciais.", passReq: { title: "A senha deve conter:", length: "Pelo menos 8 caracteres", uppercase: "Uma letra maiúscula", number: "Um número", symbol: "Um símbolo (!@#$...)" } },
        companionModal: { title: "Iniciar Modo Companheiro", close: "Fechar", description: "Selecione contatos para compartilhar sua localização ao vivo e defina una duração.", shareWith: "Compartilhar com:", noContacts: "Por favor, adicione um contato de emergência primeiro.", duration: "Duração:", minutes: "min", hour: "h", cancel: "Cancelar", startSharing: "Começar a Compartilhar", alertNoContact: "Por favor, selecione pelo menos um contato." },
        home: { elderlyMode: "Modo Idoso", sos: "SOS", cancel: "CANCELAR", statusSafe: "Você está Seguro", statusActive: "EMERGÊNCIA ATIVA", companionMode: "Modo Companheiro", status: "Status:", active: "Ativo", inactive: "Inativo", sharingWith: "Compartilhando localização com:", mapLoading: "Carregando mapa...", stopSharing: "Parar de Compartilhar", markSafe: "Marcar como Seguro", slideToShareLocation: "Deslize para Compartilhar Localização", safewordPrompt: "Digite sua palavra de segurança para desativar SOS", safewordPlaceholder: "Palavra de segurança", confirmSafe: "Confirmar Seguro", incorrectSafeword: "Palavra de segurança incorreta. Tente novamente.", safewordRequired: "Palavra de segurança é necessária para desativar SOS.", yourLocation: "Sua Localização", tapToExpand: "Toque para expandir", gettingLocation: "Obtendo localização...", back: "Voltar", coordinates: "Coordenadas" },
        contacts: { title: "Contatos de Emergência", description: "Gerencie as pessoas que serão notificadas em uma emergência.", addContact: "Adicionar Contato", contactNum: "Contato #", remove: "Remover Contato", fullName: "Nome Completo", phone: "Número de Telefone", email: "Endereço de E-mail" },
        history: { title: "Histórico de Alertas", description: "Alertas recentes e registros de atividades serão mostrados aqui.", noHistory: "Ainda não há histórico de alertas" },
        camera: { error: "Não foi possível acessar a câmera. Verifique as permissões.", cancel: "Cancelar", capture: "Capturar" },
        shareModal: { title: "Compartilhar Perfil", description: "Compartilhe um link para o seu perfil.", copy: "Copiar", copied: "Copiado!", shareVia: "Compartilhar via...", error: "A API de Compartilhamento Web não é suportada no seu navegador." },
        statusModal: { title: "Editar Status", emojiLabel: "Emoji", textLabel: "Status", save: "Salvar", cancel: "Cancelar" },
        profile: { settings: "Configurações", share: "Compartilhar Perfil", setStatus: "Defina seu status", viewPicture: "Ver foto do perfil" },
        settings: { title: "Configurações", back: "Voltar", profile: "Perfil", upload: "Carregar", camera: "Câmera", username: "Nome de usuário", email: "Endereço de E-mail", safeword: "Palavra de Segurança para Ativação por Voz", safewordPlaceholder: "ex. 'Anjo da Guarda'", changePass: "Alterar Senha", currentPass: "Senha Atual", newPass: "Nova Senha", confirmPass: "Confirmar Nova Senha", appearance: "Aparência", light: "Claro", dark: "Escuro", automatic: "Automático", language: "Idioma do App", notifications: "Notificações", sosAlerts: "Alertas SOS", sosAlertsDesc: "Receber alertas em situações de emergência.", companionUpdates: "Atualizações do Modo Companheiro", companionUpdatesDesc: "Ser notificado quando o rastreamento ao vivo começa ou termina.", statusUpdates: "Atualizações de Status", statusUpdatesDesc: "Alertas para “Usuário Marcado como Seguro” ou atividade do sistema.", save: "Salvar", signOut: "Sair", signOutConfirm: "Tem certeza de que deseja sair?", saveSuccess: "Configurações salvas!", langChanged: "Idioma alterado para " },
        nav: { home: "Início", contacts: "Contatos", map: "Mapa", history: "Histórico", profile: "Perfil" },
        map: { 
            title: "Mapa de Localização ao Vivo", 
            description: "Veja sua localização e sessões de companheiro ativas no mapa.",
            you: "Você",
            companions: "Companheiros", 
            sosAlerts: "Alertas SOS"
        }
    },
    hi: {
        appName: "गार्डियनलिंक",
        login: { signIn: "साइन इन करें", createAccount: "खाता बनाएं", subtext: "एक टैप से अपनी दुनिया सुरक्षित करें।", footer: "साइन इन करके आप हमारी <terms>उपयोग की शर्तें</terms> और <privacy>गोपनीयता नीति</privacy> स्वीकार करते हैं।" },
        auth: { email: "ईमेल", password: "पासवर्ड", fullName: "पूरा नाम", confirmPassword: "पासवर्ड की पुष्टि करें", signInGoogle: "Google से साइन इन करें", signInApple: "Apple से साइन इन करें", signUpGoogle: "Google से साइन अप करें", signUpApple: "Apple से साइन अप करें", or: "या", forgotPassword: "पासवर्ड भूल गए?", noAccount: "खाता नहीं है?", createOne: "एक बनाएं", hasAccount: "पहले से ही खाता है?", signInHere: "साइन इन करें", passwordValidationError: "पासवर्ड मेल नहीं खाते।", signInFailed: "साइन इन विफल। कृपया अपनी साख जांचें।", passReq: { title: "पासवर्ड में होना चाहिए:", length: "कम से कम 8 अक्षर", uppercase: "एक बड़ा अक्षर", number: "एक संख्या", symbol: "एक प्रतीक (!@#$...)" } },
        companionModal: { title: "साथी मोड शुरू करें", close: "बंद करें", description: "लाइव लोकेशन साझा करने के लिए संपर्क चुनें और अवधि निर्धारित करें।", shareWith: "इनके साथ साझा करें:", noContacts: "कृपया पहले एक आपातकालीन संपर्क जोड़ें।", duration: "अवधि:", minutes: "मिनट", hour: "घंटा", cancel: "रद्द करें", startSharing: "साझा करना शुरू करें", alertNoContact: "कृपया कम से कम एक संपर्क चुनें।" },
        home: { elderlyMode: "बुजुर्ग मोड", sos: "SOS", cancel: "रद्द करें", statusSafe: "आप सुरक्षित हैं", statusActive: "आपातकाल सक्रिय", companionMode: "साथी मोड", status: "स्थिति:", active: "सक्रिय", inactive: "निष्क्रिय", sharingWith: "इनके साथ लोकेशन साझा हो रही है:", mapLoading: "नक्शा लोड हो रहा है...", stopSharing: "साझा करना बंद करें", markSafe: "मुझे सुरक्षित चिह्नित करें", slideToShareLocation: "स्थान साझा करने के लिए स्लाइड करें", safewordPrompt: "SOS निष्क्रिय करने के लिए अपना सुरक्षा शब्द दर्ज करें", safewordPlaceholder: "सुरक्षा शब्द", confirmSafe: "सुरक्षित की पुष्टि करें", incorrectSafeword: "गलत सुरक्षा शब्द। कृपया पुनः प्रयास करें।", safewordRequired: "SOS निष्क्रिय करने के लिए सुरक्षा शब्द आवश्यक है।", yourLocation: "आपका स्थान", tapToExpand: "विस्तार करने के लिए टैप करें", gettingLocation: "स्थान प्राप्त किया जा रहा है...", back: "वापस", coordinates: "निर्देशांक" },
        contacts: { title: "आपातकालीन संपर्क", description: "उन लोगों का प्रबंधन करें जिन्हें आपात स्थिति में सूचित किया जाएगा।", addContact: "संपर्क जोड़ें", contactNum: "संपर्क #", remove: "संपर्क हटाएं", fullName: "पूरा नाम", phone: "फोन नंबर", email: "ईमेल पता" },
        history: { title: "अलर्ट इतिहास", description: "हाल के अलर्ट और गतिविधि लॉग यहां दिखाए जाएंगे।", noHistory: "अभी तक कोई अलर्ट इतिहास नहीं" },
        camera: { error: "कैमरे तक नहीं पहुंच सका। कृपया अनुमतियों की जांच करें।", cancel: "रद्द करें", capture: "कैप्चर करें" },
        shareModal: { title: "प्रोफ़ाइल साझा करें", description: "दूसरों के साथ अपनी प्रोफ़ाइल का लिंक साझा करें।", copy: "कॉपी करें", copied: "कॉपी किया गया!", shareVia: "इसके माध्यम से साझा करें...", error: "वेब शेयर एपीआई आपके ब्राउज़र में समर्थित नहीं है।" },
        statusModal: { title: "स्थिति संपादित करें", emojiLabel: "इमोजी", textLabel: "स्थिति", save: "सहेजें", cancel: "रद्द करें" },
        profile: { settings: "सेटिंग्स", share: "प्रोफ़ाइल साझा करें", setStatus: "अपनी स्थिति सेट करें", viewPicture: "प्रोफ़ाइल चित्र देखें" },
        settings: { title: "सेटिंग्स", back: "वापस", profile: "प्रोफ़ाइल", upload: "अपलोड करें", camera: "कैमरा", username: "उपयोगकर्ता नाम", email: "ईमेल पता", safeword: "वॉयस एक्टिवेशन सेफवर्ड", safewordPlaceholder: "जैसे, 'गार्जियन एंजेल'", changePass: "पासवर्ड बदलें", currentPass: "वर्तमान पासवर्ड", newPass: "नया पासवर्ड", confirmPass: "नए पासवर्ड की पुष्टि करें", appearance: "दिखावट", light: "लाइट", dark: "डार्क", automatic: "स्वचालित", language: "ऐप की भाषा", notifications: "सूचनाएं", sosAlerts: "SOS अलर्ट", sosAlertsDesc: "आपातकालीन स्थितियों के लिए अलर्ट प्राप्त करें।", companionUpdates: "साथी मोड अपडेट", companionUpdatesDesc: "लाइव ट्रैकिंग शुरू या समाप्त होने पर सूचित करें।", statusUpdates: "स्थिति अपडेट", statusUpdatesDesc: "'उपयोगकर्ता सुरक्षित चिह्नित' या सिस्टम गतिविधि के लिए अलर्ट।", save: "सेटिंग्स सहेजें", signOut: "साइन आउट करें", signOutConfirm: "क्या आप वाकई साइन आउट करना चाहते हैं?", saveSuccess: "सेटिंग्स सहेजी गईं!", langChanged: "भाषा इसमें बदल गई है " },
        nav: { home: "होम", contacts: "संपर्क", map: "नक्शा", history: "इतिहास", profile: "प्रोफ़ाइल" },
        map: { 
            title: "लाइव लोकेशन मैप", 
            description: "मैप पर अपना स्थान और सक्रिय साथी सत्र देखें।",
            you: "आप",
            companions: "साथी", 
            sosAlerts: "SOS अलर्ट"
        }
    },
    zh: {
        appName: "守护链接",
        login: { signIn: "登录", createAccount: "创建账户", subtext: "一键守护您的世界。", footer: "登录即表示您接受我们的<terms>使用条款</terms>和<privacy>隐私政策</privacy>。" },
        auth: { email: "电子邮件", password: "密码", fullName: "全名", confirmPassword: "确认密码", signInGoogle: "使用 Google 登录", signInApple: "使用 Apple 登录", signUpGoogle: "使用 Google 注册", signUpApple: "使用 Apple 注册", or: "或", forgotPassword: "忘记密码？", noAccount: "没有账户？", createOne: "创建一个", hasAccount: "已有账户？", signInHere: "登录", passwordValidationError: "密码不匹配。", signInFailed: "登录失败。请检查您的凭据。", passReq: { title: "密码必须包含：", length: "至少8个字符", uppercase: "一个大写字母", number: "一个数字", symbol: "一个符号 (!@#$...)" } },
        companionModal: { title: "开启陪伴模式", close: "关闭", description: "选择联系人分享您的实时位置并设置持续时间。", shareWith: "分享给：", noContacts: "请先添加紧急联系人。", duration: "持续时间：", minutes: "分钟", hour: "小时", cancel: "取消", startSharing: "开始分享", alertNoContact: "请至少选择一个联系人。" },
        home: { elderlyMode: "长者模式", sos: "SOS", cancel: "取消", statusSafe: "您是安全的", statusActive: "紧急情况激活", companionMode: "陪伴模式", status: "状态：", active: "活动中", inactive: "未激活", sharingWith: "正在与以下用户分享位置：", mapLoading: "地图加载中...", stopSharing: "停止分享", markSafe: "标记我为安全", slideToShareLocation: "滑动以分享位置", safewordPrompt: "输入您的安全词以停用SOS", safewordPlaceholder: "安全词", confirmSafe: "确认安全", incorrectSafeword: "安全词不正确。请重试。", safewordRequired: "停用SOS需要安全词。", yourLocation: "您的位置", tapToExpand: "点击以展开", gettingLocation: "正在获取位置...", back: "返回", coordinates: "坐标" },
        contacts: { title: "紧急联系人", description: "管理在紧急情况下将收到通知的人员。", addContact: "添加联系人", contactNum: "联系人 #", remove: "移除联系人", fullName: "全名", phone: "电话号码", email: "电子邮件地址" },
        history: { title: "警报历史", description: "最近的警报和活动日志将在此处显示。", noHistory: "暂无警报历史" },
        camera: { error: "无法访问相机。请检查权限。", cancel: "取消", capture: "拍摄" },
        shareModal: { title: "分享个人资料", description: "与他人分享您的个人资料链接。", copy: "复制", copied: "已复制！", shareVia: "通过...分享", error: "您的浏览器不支持Web Share API。" },
        statusModal: { title: "编辑状态", emojiLabel: "表情符号", textLabel: "状态", save: "保存", cancel: "取消" },
        profile: { settings: "设置", share: "分享个人资料", setStatus: "设置您的状态", viewPicture: "查看个人资料图片" },
        settings: { title: "设置", back: "返回", profile: "个人资料", upload: "上传", camera: "相机", username: "用户名", email: "电子邮件地址", safeword: "语音激活安全词", safewordPlaceholder: "例如，“守护天使”", changePass: "更改密码", currentPass: "当前密码", newPass: "新密码", confirmPass: "确认新密码", appearance: "外观", light: "浅色", dark: "深色", automatic: "自动", language: "应用语言", notifications: "通知", sosAlerts: "SOS 警报", sosAlertsDesc: "接收紧急情况警报。", companionUpdates: "陪伴模式更新", companionUpdatesDesc: "在实时跟踪开始或结束时收到通知。", statusUpdates: "状态更新", statusUpdatesDesc: "“用户标记为安全”或系统活动的警报。", save: "保存设置", signOut: "退出登录", signOutConfirm: "您确定要退出登录吗？", saveSuccess: "设置已保存！", langChanged: "语言已更改为 " },
        nav: { home: "主页", contacts: "联系人", map: "地图", history: "历史", profile: "个人资料" },
        map: { 
            title: "实时位置地图", 
            description: "在地图上查看您的位置和活跃的陪伴会话。",
            you: "您",
            companions: "陪伴者", 
            sosAlerts: "SOS 警报"
        }
    },
    ar: {
        appName: "جارديان لينك",
        login: { signIn: "تسجيل الدخول", createAccount: "إنشاء حساب", subtext: "أمّن عالمك بنقرة واحدة.", footer: "بتسجيل الدخول، فإنك توافق على <terms>شروط الاستخدام</terms> و<privacy>سياسة الخصوصية</privacy>." },
        auth: { email: "البريد الإلكتروني", password: "كلمة المرور", fullName: "الاسم الكامل", confirmPassword: "تأكيد كلمة المرور", signInGoogle: "تسجيل الدخول باستخدام Google", signInApple: "تسجيل الدخول باستخدام Apple", signUpGoogle: "التسجيل باستخدام Google", signUpApple: "التسجيل باستخدام Apple", or: "أو", forgotPassword: "هل نسيت كلمة المرور؟", noAccount: "ليس لديك حساب؟", createOne: "أنشئ حسابًا", hasAccount: "هل لديك حساب بالفعل؟", signInHere: "تسجيل الدخول", passwordValidationError: "كلمتا المرور غير متطابقتين.", signInFailed: "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد الخاصة بك.", passReq: { title: "يجب أن تحتوي كلمة المرور على:", length: "8 أحرف على الأقل", uppercase: "حرف كبير واحد", number: "رقم واحد", symbol: "رمز واحد (!@#$...)" } },
        companionModal: { title: "بدء وضع الرفيق", close: "إغلاق", description: "حدد جهات اتصال لمشاركة موقعك المباشر معها وتعيين مدة للجلسة.", shareWith: "مشاركة مع:", noContacts: "يرجى إضافة جهة اتصال للطوارئ أولاً.", duration: "المدة:", minutes: "دقيقة", hour: "ساعة", cancel: "إلغاء", startSharing: "بدء المشاركة", alertNoContact: "يرجى تحديد جهة اتصال واحدة على الأقل." },
        home: { elderlyMode: "وضع كبار السن", sos: "SOS", cancel: "إلغاء", statusSafe: "أنت آمن", statusActive: "الطوارئ نشطة", companionMode: "وضع الرفيق", status: "الحالة:", active: "نشط", inactive: "غير نشط", sharingWith: "تتم مشاركة الموقع مع:", mapLoading: "جارٍ تحميل الخريطة...", stopSharing: "إيقاف المشاركة", markSafe: "تحديد أنني آمن", slideToShareLocation: "اسحب لمشاركة الموقع", safewordPrompt: "أدخل كلمة الأمان الخاصة بك لإلغاء تنشيط SOS", safewordPlaceholder: "كلمة الأمان", confirmSafe: "تأكيد الأمان", incorrectSafeword: "كلمة أمان غير صحيحة. يرجى المحاولة مرة أخرى.", safewordRequired: "كلمة الأمان مطلوبة لإلغاء تنشيط SOS.", yourLocation: "موقعك", tapToExpand: "انقر للتوسيع", gettingLocation: "جارٍ الحصول على الموقع...", back: "رجوع", coordinates: "الإحداثيات" },
        contacts: { title: "جهات اتصال الطوارئ", description: "إدارة الأشخاص الذين سيتم إخطارهم في حالات الطوارئ.", addContact: "إضافة جهة اتصال", contactNum: "جهة اتصال #", remove: "إزالة جهة اتصال", fullName: "الاسم الكامل", phone: "رقم الهاتف", email: "البريد الإلكتروني" },
        history: { title: "سجل التنبيهات", description: "سيتم عرض التنبيهات الأخيرة وسجلات النشاط هنا.", noHistory: "لا يوجد سجل تنبيهات حتى الآن" },
        camera: { error: "تعذر الوصول إلى الكاميرا. يرجى التحقق من الأذونات.", cancel: "إلغاء", capture: "التقاط" },
        shareModal: { title: "مشاركة الملف الشخصي", description: "شارك رابط ملفك الشخصي مع الآخرين.", copy: "نسخ", copied: "تم النسخ!", shareVia: "مشاركة عبر...", error: "واجهة برمجة تطبيقات المشاركة على الويب غير مدعومة في متصفحك." },
        statusModal: { title: "تعديل الحالة", emojiLabel: "رمز تعبيري", textLabel: "الحالة", save: "حفظ", cancel: "إلغاء" },
        profile: { settings: "الإعدادات", share: "مشاركة الملف الشخصي", setStatus: "عيّن حالتك", viewPicture: "عرض صورة الملف الشخصي" },
        settings: { title: "الإعدادات", back: "رجوع", profile: "الملف الشخصي", upload: "تحميل", camera: "الكاميرا", username: "اسم المستخدم", email: "البريد الإلكتروني", safeword: "كلمة الأمان للتفعيل الصوتي", safewordPlaceholder: "مثال: 'الملاك الحارس'", changePass: "تغيير كلمة المرور", currentPass: "كلمة المرور الحالية", newPass: "كلمة المرور الجديدة", confirmPass: "تأكيد كلمة المرور الجديدة", appearance: "المظهر", light: "فاتح", dark: "داكن", automatic: "تلقائي", language: "لغة التطبيق", notifications: "الإشعارات", sosAlerts: "تنبيهات SOS", sosAlertsDesc: "استقبال تنبيهات لحالات الطوارئ.", companionUpdates: "تحديثات وضع الرفيق", companionUpdatesDesc: "الحصول على إشعار عند بدء أو انتهاء التتبع المباشر.", statusUpdates: "تحديثات الحالة", statusUpdatesDesc: "تنبيهات لـ 'تم تحديد المستخدم كآمن' أو نشاط النظام.", save: "حفظ الإعدادات", signOut: "تسجيل الخروج", signOutConfirm: "هل أنت متأكد أنك تريد تسجيل الخروج؟", saveSuccess: "تم حفظ الإعدادات!", langChanged: "تم تغيير اللغة إلى " },
        nav: { home: "الرئيسية", contacts: "جهات الاتصال", map: "الخريطة", history: "السجل", profile: "الملف الشخصي" },
        map: { 
            title: "خريطة الموقع المباشر", 
            description: "اعرض موقعك وجلسات الرفيق النشطة على الخريطة.",
            you: "أنت",
            companions: "الرفاق", 
            sosAlerts: "تنبيهات SOS"
        }
    }
};

const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'pt', name: 'Português' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'zh', name: '中文 (简体)' },
    { code: 'ar', name: 'العربية' },
];

const rtlLanguages = ['ar'];

const LocalizationContext = createContext(null);

const LocalizationProvider = ({ children }: { children?: React.ReactNode }) => {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const storedLang = localStorage.getItem('guardianlink-lang');
        const browserLang = navigator.language.split('-')[0];
        const initialLang = storedLang || (translations[browserLang] ? browserLang : 'en');
        setLanguage(initialLang);
    }, []);

    useEffect(() => {
        localStorage.setItem('guardianlink-lang', language);
        document.documentElement.lang = language;
        if (rtlLanguages.includes(language)) {
            document.documentElement.dir = 'rtl';
            document.body.classList.add('rtl-mode');
        } else {
            document.documentElement.dir = 'ltr';
            document.body.classList.remove('rtl-mode');
        }
    }, [language]);

    const t = (key) => {
        const keys = key.split('.');
        let result = translations[language] || translations.en;
        for (const k of keys) {
            result = result[k];
            if (!result) {
                // Fallback to English
                let fallback = translations.en;
                for (const fk of keys) {
                    fallback = fallback[fk];
                    if (!fallback) return key;
                }
                return fallback;
            }
        }
        return result || key;
    };
    
    return (
        <LocalizationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LocalizationContext.Provider>
    );
};

const useLocalization = () => useContext(LocalizationContext);

// --- END LOCALIZATION SETUP ---

const GuardianLinkLogo = () => (
    <svg viewBox="0 0 120 145" xmlns="http://www.w3.org/2000/svg">
        <g opacity="0.7">
            {/* Shield Path */}
            <path 
                d="M60 5 L110 30 V70 C110 100 60 120 60 120 C60 120 10 100 10 70 V30 L60 5 Z" 
                fill="#d5e9ff" 
                fillOpacity="0.1"
                stroke="#d5e9ff" 
                strokeWidth="4" 
            />
            
            {/* Stylized G */}
            <path 
                d="M85,62.5 A22.5,22.5 0 1 1 62.5,40 L62.5,55 L75,55"
                fill="none"
                stroke="#d5e9ff"
                strokeWidth="8"
                strokeLinecap="round"
            />

             {/* People/Wave Symbol */}
            <path
                d="M45 68 C 52 62, 63 62, 70 68 M 45 75 C 52 69, 63 69, 70 75"
                fill="none"
                stroke="#d5e9ff"
                strokeWidth="4"
                strokeLinecap="round"
            />
        </g>
        <text x="60" y="138" textAnchor="middle" fontSize="20" fill="#d5e9ff" fontFamily="Inter, sans-serif" fontWeight="600" opacity="0.8">
            GuardianLink
        </text>
    </svg>
);

const LandingScreen = ({ onNavigateToSignIn, onNavigateToSignUp }) => {
    const { t } = useLocalization();
    const footerText = t('login.footer');
    const parts = footerText.split(/<terms>|<\/terms>|<privacy>|<\/privacy>/);
    return (
        <div className="login-container">
            <div className="login-content">
                <div className="login-logo">
                    <GuardianLinkLogo />
                </div>

                <div className="login-actions">
                    <button className="btn btn-login-primary" onClick={onNavigateToSignIn}>
                        {t('login.signIn')}
                    </button>
                    <button className="btn btn-login-secondary" onClick={onNavigateToSignUp}>
                        {t('login.createAccount')}
                    </button>
                    <p className="login-subtext">{t('login.subtext')}</p>
                </div>

                <div className="login-footer">
                   <p>
                        {parts[0]}
                        <a href="#">{parts[1]}</a>
                        {parts[2]}
                        <a href="#">{parts[3]}</a>
                        {parts[4]}
                    </p>
                </div>
            </div>
        </div>
    );
};

const SignInScreen = ({ onLogin, onNavigateToSignUp }) => {
    const { t } = useLocalization();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        try {
            const response = await authAPI.login(email, password);
            storage.setAuthToken(response.token);
            storage.setUser(response.user);
            onLogin(response.user, response.token);
        } catch (error: any) {
            setError(error.message || t('auth.signInFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="login-logo">
                <GuardianLinkLogo />
            </div>
            <h1>{t('login.signIn')}</h1>
            <button className="btn social-btn google-btn">{t('auth.signInGoogle')}</button>
            <button className="btn social-btn apple-btn">{t('auth.signInApple')}</button>
            <div className="social-login-divider"><span>{t('auth.or')}</span></div>

            <form onSubmit={handleSubmit} className="auth-form">
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="email">{t('auth.email')}</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">{t('auth.password')}</label>
                    <div className="password-input-wrapper">
                        <input type={showPassword ? "text" : "password"} id="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn" aria-label="Toggle password visibility">
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <a href="#" className="forgot-password-link">{t('auth.forgotPassword')}</a>
                </div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isLoading}>
                    {isLoading ? <div className="spinner"></div> : t('login.signIn')}
                </button>
            </form>

            <p className="auth-switcher">
                {t('auth.noAccount')} <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToSignUp(); }}>{t('auth.createOne')}</a>
            </p>
        </div>
    );
};

const PasswordValidationFeedback = ({ password }) => {
    const { t } = useLocalization();
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const criteria = [
        { key: 'length', text: t('auth.passReq.length'), valid: checks.length },
        { key: 'uppercase', text: t('auth.passReq.uppercase'), valid: checks.uppercase },
        { key: 'number', text: t('auth.passReq.number'), valid: checks.number },
        { key: 'symbol', text: t('auth.passReq.symbol'), valid: checks.symbol },
    ];
    
    if (!password) return null;

    return (
        <div className="password-validation-feedback">
            <p>{t('auth.passReq.title')}</p>
            <ul>
                {criteria.map(item => (
                    <li key={item.key} className={item.valid ? 'valid' : ''}>
                        {item.valid ? '✓' : '•'} {item.text}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SignUpScreen = ({ onLogin, onNavigateToSignIn }) => {
    const { t } = useLocalization();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(t('auth.passwordValidationError'));
            return;
        }
        setError('');
        setIsLoading(true);
        
        try {
            const response = await authAPI.register(fullName, email, password);
            storage.setAuthToken(response.token);
            storage.setUser(response.user);
            onLogin(response.user, response.token);
        } catch (error: any) {
            setError(error.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="login-logo">
                <GuardianLinkLogo />
            </div>
            <h1>{t('login.createAccount')}</h1>
            <button className="btn social-btn google-btn">{t('auth.signUpGoogle')}</button>
            <button className="btn social-btn apple-btn">{t('auth.signUpApple')}</button>
            <div className="social-login-divider"><span>{t('auth.or')}</span></div>

            <form onSubmit={handleSubmit} className="auth-form">
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="fullName">{t('auth.fullName')}</label>
                    <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="signup-email">{t('auth.email')}</label>
                    <input type="email" id="signup-email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="signup-password">{t('auth.password')}</label>
                    <div className="password-input-wrapper">
                        <input type={showPassword ? "text" : "password"} id="signup-password" value={password} onChange={e => setPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle-btn" aria-label="Toggle password visibility">
                           {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>
                <PasswordValidationFeedback password={password} />
                <div className="form-group">
                    <label htmlFor="confirm-password">{t('auth.confirmPassword')}</label>
                    <input type="password" id="confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isLoading}>
                    {isLoading ? <div className="spinner"></div> : t('login.createAccount')}
                </button>
            </form>

            <p className="auth-switcher">
                {t('auth.hasAccount')} <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToSignIn(); }}>{t('auth.signInHere')}</a>
            </p>
        </div>
    );
};

const SafewordVerificationModal = ({ onClose, onVerify, userSafeword }) => {
    const [safeword, setSafeword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useLocalization();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!safeword.trim()) {
            setError(t('home.safewordRequired'));
            return;
        }

        // Client-side validation (optional - can be removed if you trust backend only)
        if (userSafeword && safeword.trim().toLowerCase() !== userSafeword.toLowerCase()) {
            setError(t('home.incorrectSafeword'));
            setSafeword('');
            return;
        }

        // Call backend for verification
        setIsSubmitting(true);
        try {
            await onVerify(safeword);
            // Success - modal will be closed by parent component
        } catch (error) {
            // Handle backend errors
            console.error('Backend verification failed:', error);
            if (error.message && error.message.includes('Incorrect safeword')) {
                setError(t('home.incorrectSafeword'));
            } else {
                setError(error.message || t('home.safewordRequired'));
            }
            setSafeword('');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleEsc = (event) => {
           if (event.keyCode === 27) onClose();
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🔒 {t('home.markSafe')}</h2>
                    <button onClick={onClose} className="close-btn" aria-label="Close">
                        &times;
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p>{t('home.safewordPrompt')}</p>
                        <div className="form-group">
                            <input
                                type="password"
                                value={safeword}
                                onChange={(e) => {
                                    setSafeword(e.target.value);
                                    setError('');
                                }}
                                placeholder={t('home.safewordPlaceholder')}
                                autoFocus
                                className={error ? 'input-error' : ''}
                            />
                            {error && <p className="error-message">{error}</p>}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                            {t('companionModal.cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Verifying...' : t('home.confirmSafe')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CompanionModeModal = ({ contacts, onClose, onStart }) => {
    const [selectedContactIds, setSelectedContactIds] = useState([]);
    const [duration, setDuration] = useState(30);
    const { t } = useLocalization();

    const handleContactToggle = (contactId) => {
        setSelectedContactIds(prev =>
            prev.includes(contactId)
                ? prev.filter(id => id !== contactId)
                : [...prev, contactId]
        );
    };

    const handleStart = () => {
        if (selectedContactIds.length === 0) {
            alert(t('companionModal.alertNoContact'));
            return;
        }
        onStart(selectedContactIds, duration);
    };
    
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handleEsc = (event) => {
           if (event.keyCode === 27) onClose();
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('companionModal.title')}</h2>
                    <button onClick={onClose} className="close-btn" aria-label={t('companionModal.close')}>
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    <p>{t('companionModal.description')}</p>

                    <div className="form-group">
                        <label>{t('companionModal.shareWith')}</label>
                        <div className="contact-selection-list">
                            {contacts.length > 0 ? contacts.map(contact => (
                                <label key={contact.id} className="contact-selection-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedContactIds.includes(contact.id)}
                                        onChange={() => handleContactToggle(contact.id)}
                                    />
                                    <span>{contact.name}</span>
                                </label>
                            )) : <p>{t('companionModal.noContacts')}</p>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="duration">{t('companionModal.duration')}</label>
                        <div className="duration-options">
                            {[15, 30, 60, 120].map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    className={`btn ${duration === d ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setDuration(d)}
                                >
                                    {d < 60 ? `${d} ${t('companionModal.minutes')}` : `${d/60} ${t('companionModal.hour')}`}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>{t('companionModal.cancel')}</button>
                    <button type="button" className="btn btn-primary" onClick={handleStart} disabled={contacts.length === 0}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                            <path d="M1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9.5a.5.5 0 0 0-1 0V14a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5.5V2a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v4.5a.5.5 0 0 0 1 0V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12z"/>
                        </svg>
                        {t('companionModal.startSharing')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MapView = ({ center }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  useEffect(() => {
    if (map.current) return; // Initialize map only once
    
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    
    if (!apiKey) {
      console.error('MapTiler API key not configured');
      return;
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
      center: [center.lng, center.lat], // MapLibre uses [lng, lat]
      zoom: 15,
    });

    // Add navigation controls (zoom, rotate)
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Create custom marker
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = 'var(--accent-primary)';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';

    marker.current = new maplibregl.Marker({ element: el })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);

  }, []); // Empty dependency array - only run once

  // Update marker position when center changes
  useEffect(() => {
    if (map.current && marker.current) {
      marker.current.setLngLat([center.lng, center.lat]);
      map.current.flyTo({
        center: [center.lng, center.lat],
        essential: true,
        duration: 1000
      });
    }
  }, [center]);

  return <div ref={mapContainer} id="map" style={{ width: '100%', height: '100%' }} />;
};

// Mini-map component for home screen
const MiniMapView = ({ center }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  useEffect(() => {
    if (map.current) return;
    
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    if (!apiKey) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
      center: [center.lng, center.lat],
      zoom: 14,
      interactive: false, // Disable interaction on mini-map
    });

    // Custom marker
    const el = document.createElement('div');
    el.className = 'custom-marker-mini';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = 'var(--accent-primary)';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

    marker.current = new maplibregl.Marker({ element: el })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);

  }, []);

  useEffect(() => {
    if (map.current && marker.current) {
      marker.current.setLngLat([center.lng, center.lat]);
      map.current.setCenter([center.lng, center.lat]);
    }
  }, [center]);

  return <div ref={mapContainer} className="mini-map" style={{ width: '100%', height: '100%', borderRadius: '8px' }} />;
};

// Full-screen map view
const FullScreenMapView = ({ center, onClose }) => {
  const { t } = useLocalization();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  useEffect(() => {
    if (map.current) return;
    
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    if (!apiKey) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
      center: [center.lng, center.lat],
      zoom: 15,
      interactive: true,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Custom marker
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = 'var(--accent-primary)';
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)';

    marker.current = new maplibregl.Marker({ element: el })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);
  }, []);

  useEffect(() => {
    if (map.current && marker.current) {
      marker.current.setLngLat([center.lng, center.lat]);
      map.current.flyTo({
        center: [center.lng, center.lat],
        duration: 1000
      });
    }
  }, [center]);

  return (
    <div className="fullscreen-map-overlay">
      <div className="fullscreen-map-header">
        <button onClick={onClose} className="map-back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('home.back')}
        </button>
        <h2>📍 {t('home.yourLocation')}</h2>
        <div style={{ width: '80px' }} /> {/* Spacer for centering */}
      </div>
      <div ref={mapContainer} className="fullscreen-map" />
      <div className="fullscreen-map-info">
        <p>{t('home.coordinates')}: {center.lat.toFixed(6)}, {center.lng.toFixed(6)}</p>
      </div>
    </div>
  );
};

const HomeScreen = ({
  isElderlyMode,
  setIsElderlyMode,
  isSosActive,
  companionSession,
  handleStartSos,
  handleCancelSos,
  handleMarkSafe,
  sosCountdown,
  timeLeft,
  formatTime,
  isMapScriptLoaded,
  currentPosition,
  stopCompanionMode,
  onOpenCompanionModal,
  onExpandMap,
  // AI Distress Detection props
  isDistressMonitoring,
  microphonePermission,
  initializeDistressDetection,
  stopDistressDetection
}) => {
  const { t } = useLocalization();
  
  // Track user's live location for mini-map
  const [userLiveLocation, setUserLiveLocation] = useState(null);
  const liveLocationWatchId = useRef(null);

  useEffect(() => {
    // Start watching user's live location
    if (navigator.geolocation) {
      liveLocationWatchId.current = navigator.geolocation.watchPosition(
        (position) => {
          setUserLiveLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.error('Live location error:', error),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }

    return () => {
      if (liveLocationWatchId.current) {
        navigator.geolocation.clearWatch(liveLocationWatchId.current);
      }
    };
  }, []);

  return (
    <div className="home-screen">
      <div className="home-header">
        <h1>{t('appName')}</h1>
        <div className="form-group toggle-group">
          <label htmlFor="elderly-mode-home">{t('home.elderlyMode')}</label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              id="elderly-mode-home"
              checked={isElderlyMode}
              onChange={() => setIsElderlyMode(!isElderlyMode)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
      
      <div className="sos-panel">
        <button
          className={`sos-button ${sosCountdown !== null ? 'sos-pending' : ''}`}
          aria-label="Activate SOS"
          onClick={sosCountdown !== null ? handleCancelSos : handleStartSos}
        >
          {sosCountdown !== null ? (
            <>
              {t('home.cancel')}
              <span className="sos-timer">{sosCountdown}</span>
            </>
          ) : (
            t('home.sos')
          )}
        </button>
        <p className={`status-label ${isSosActive ? 'status-active' : ''}`}>
          {isSosActive ? t('home.statusActive') : t('home.statusSafe')}
        </p>
        
        {/* Companion Mode Slide Toggle */}
        {!companionSession.isActive && (
          <button 
            className="companion-slide-button"
            onClick={onOpenCompanionModal}
            disabled={isSosActive}
          >
            <div className="slide-content">
              <span className="slide-icon">📍</span>
              <span className="slide-text">{t('home.slideToShareLocation')}</span>
              <svg className="slide-arrow" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3l7 7-7 7V3z"/>
              </svg>
            </div>
          </button>
        )}
      </div>

      <div className="companion-panel">
        <h2>{t('home.companionMode')}</h2>
        <p>{t('home.status')} <strong>{companionSession.isActive ? t('home.active') : t('home.inactive')}</strong></p>
        
        {companionSession.isActive && (
          <div className="companion-active-details">
            <div className="timer">{formatTime(timeLeft)}</div>
            <p>{t('home.sharingWith')} <strong>{companionSession.sharedWith.join(', ')}</strong></p>
            {isMapScriptLoaded && currentPosition ? (
                <MapView center={currentPosition} />
            ) : currentPosition && !isMapScriptLoaded ? (
                <div className="map-placeholder">
                  <p>📍 Current Location</p>
                  <p style={{fontSize: '0.9em', color: '#666'}}>Lat: {currentPosition.lat.toFixed(6)}, Lng: {currentPosition.lng.toFixed(6)}</p>
                  <p style={{fontSize: '0.8em', marginTop: '10px', color: '#999'}}>Map not available - MapTiler API key not configured</p>
                </div>
            ) : (
                <div className="map-placeholder">{t('home.mapLoading')}</div>
            )}
             <button type="button" className="btn btn-secondary" onClick={stopCompanionMode}>{t('home.stopSharing')}</button>
          </div>
        )}
      </div>

      {/* AI Distress Monitoring Status */}
      <div className="ai-monitoring-panel">
        <h2>🤖 AI Guardian</h2>
        <div className={`ai-status-indicator ${isDistressMonitoring ? 'active' : 'inactive'}`}>
          <div className="status-icon">
            {isDistressMonitoring ? '🎤' : '⚠️'}
          </div>
          <div className="status-content">
            <div className="status-title">
              {isDistressMonitoring ? 'AI Guardian Active' : 'AI Guardian Inactive'}
            </div>
            <div className="status-description">
              {isDistressMonitoring 
                ? 'Listening for distress signals...' 
                : microphonePermission === 'denied' 
                  ? 'Microphone access required'
                  : 'Click to activate AI monitoring'
              }
            </div>
          </div>
        </div>
        
        {!isDistressMonitoring && (
          <button
            className="btn btn-primary ai-enable-btn"
            onClick={initializeDistressDetection}
            disabled={isSosActive}
          >
            🎤 Enable AI Guardian
          </button>
        )}
        
        {isDistressMonitoring && (
          <div>
            <button
              className="btn btn-secondary ai-disable-btn"
              onClick={stopDistressDetection}
            >
              🛑 Stop AI Guardian
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                console.log('🧪 Testing distress detection with "help me"');
                if (distressManager) {
                  // Simulate a distress detection for testing
                  const testContext = {
                    detectionMethod: 'speech',
                    confidence: 85,
                    timestamp: new Date(),
                    transcript: 'help me please'
                  };
                  
                  setVerificationData({
                    detectionSource: testContext.detectionMethod,
                    confidence: testContext.confidence,
                    transcript: testContext.transcript,
                    audioMetrics: null,
                    timestamp: testContext.timestamp,
                    context: testContext
                  });
                  
                  setShowVerificationDialog(true);
                  showToast('🧪 Test distress detection triggered');
                }
              }}
              style={{ marginTop: '5px' }}
            >
              🧪 Test Detection
            </button>
          </div>
        )}
      </div>

      {isSosActive && (
        <div className="mark-safe-container">
            <button className="btn btn-primary" onClick={handleMarkSafe}>
                {t('home.markSafe')}
            </button>
        </div>
      )}

      {/* Live Location Mini-Map */}
      <div className="mini-map-container">
        <h3>📍 {t('home.yourLocation')}</h3>
        {isMapScriptLoaded && userLiveLocation ? (
          <div className="mini-map-wrapper" onClick={() => onExpandMap(userLiveLocation)}>
            <MiniMapView center={userLiveLocation} />
            <div className="map-expand-hint">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 3h5v2H5v3H3V3zm9 0h5v5h-2V5h-3V3zM3 12h2v3h3v2H3v-5zm14 0h2v5h-5v-2h3v-3z"/>
              </svg>
              {t('home.tapToExpand')}
            </div>
          </div>
        ) : userLiveLocation && !isMapScriptLoaded ? (
          <div className="map-placeholder mini-map-placeholder" onClick={() => onExpandMap(userLiveLocation)}>
            <p>📍 Current Location</p>
            <p style={{fontSize: '0.85em', color: '#666'}}>
              {userLiveLocation.lat.toFixed(6)}, {userLiveLocation.lng.toFixed(6)}
            </p>
            <p style={{fontSize: '0.75em', marginTop: '8px', color: '#999'}}>Tap to expand</p>
          </div>
        ) : (
          <div className="map-placeholder mini-map-placeholder">
            <p>{t('home.gettingLocation')}</p>
          </div>
        )}
      </div>
    </div>
  );
};


const ContactsScreen = ({ contacts, handleContactChange, addContact, removeContact, saveContact }) => {
    const { t } = useLocalization();
    return (
        <div className="page-content">
            <div className="header">
                <h1>{t('contacts.title')}</h1>
            </div>
             <div className="section-header" style={{marginTop: 0}}>
              <p>{t('contacts.description')}</p>
              <button type="button" className="btn btn-secondary" onClick={addContact}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                {t('contacts.addContact')}
              </button>
            </div>
            {contacts.map((contact, index) => (
              <div key={contact.id} className="contact-item">
                <div className="contact-header">
                  <h3>{t('contacts.contactNum')}{index + 1}</h3>
                  <button type="button" className="btn btn-danger" onClick={() => removeContact(contact.id)} aria-label={`${t('contacts.remove')} ${index + 1}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                      <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                  </button>
                </div>
                <div className="form-group">
                  <label htmlFor={`contact-name-${contact.id}`}>{t('contacts.fullName')}</label>
                  <input type="text" id={`contact-name-${contact.id}`} name="name" value={contact.name} onChange={(e) => handleContactChange(contact.id, e)} onBlur={() => saveContact && saveContact(contact)} required />
                </div>
                <div className="form-group">
                  <label htmlFor={`contact-phone-${contact.id}`}>{t('contacts.phone')}</label>
                  <input type="tel" id={`contact-phone-${contact.id}`} name="phone" value={contact.phone} onChange={(e) => handleContactChange(contact.id, e)} onBlur={() => saveContact && saveContact(contact)} required />
                </div>
                <div className="form-group">
                  <label htmlFor={`contact-email-${contact.id}`}>{t('contacts.email')}</label>
                  <input type="email" id={`contact-email-${contact.id}`} name="email" value={contact.email} onChange={(e) => handleContactChange(contact.id, e)} onBlur={() => saveContact && saveContact(contact)} required />
                </div>
              </div>
            ))}
        </div>
    );
}

const HistoryScreen = ({ onViewLocation }) => {
    const { t } = useLocalization();
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const data = await historyAPI.getHistory();
                setHistory(data);
            } catch (error) {
                console.error('Failed to load history:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadHistory();
    }, []);

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getEventIcon = (eventType) => {
        switch(eventType) {
            case 'SOS_ACTIVATED': return '🚨';
            case 'COMPANION_STARTED': return '📍';
            case 'COMPANION_ENDED': return '✅';
            default: return '📌';
        }
    };

    const getEventColor = (eventType) => {
        switch(eventType) {
            case 'SOS_ACTIVATED': return 'var(--danger-primary)';
            case 'COMPANION_STARTED': return 'var(--accent-primary)';
            case 'COMPANION_ENDED': return 'var(--brand-green)';
            default: return 'var(--text-secondary)';
        }
    };

    const handleViewLocation = (lat, lng) => {
        onViewLocation({ lat, lng });
    };

    return (
        <div className="page-content">
            <div className="header">
                <h1>{t('history.title')}</h1>
            </div>
            {isLoading ? (
                <div style={{textAlign: 'center', padding: '2rem'}}>
                    <div className="spinner" style={{margin: '0 auto'}}></div>
                </div>
            ) : history.length === 0 ? (
                <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>
                    {t('history.noHistory') || 'No alert history yet'}
                </p>
            ) : (
                <div className="history-list">
                    {history.map((event) => (
                        <div key={event.id} className="history-item" style={{borderLeftColor: getEventColor(event.eventType)}}>
                            <div className="history-icon">{getEventIcon(event.eventType)}</div>
                            <div className="history-details">
                                <h3>{event.eventType.replace('_', ' ')}</h3>
                                <p>{event.metadata}</p>
                                {event.latitude && event.longitude && (
                                    <button 
                                        className="history-location-btn"
                                        onClick={() => handleViewLocation(event.latitude, event.longitude)}
                                    >
                                        📍 View Location: {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                                    </button>
                                )}
                                <span className="history-time">{formatDate(event.timestamp)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const CameraView = ({ onCapture, onClose }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const { t } = useLocalization();

    useEffect(() => {
        const openCamera = async () => {
            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = streamRef.current;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                alert(t('camera.error'));
                onClose();
            }
        };
        openCamera();
        
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [onClose, t]);

    const handleCapture = () => {
        const video = videoRef.current;
        if (!video) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        onCapture(dataUrl);
    };

    return (
        <div className="camera-overlay">
            <video ref={videoRef} autoPlay playsInline className="camera-video"></video>
            <div className="camera-controls">
                <button type="button" className="btn btn-secondary" onClick={onClose}>{t('camera.cancel')}</button>
                <button type="button" className="btn btn-primary" onClick={handleCapture}>{t('camera.capture')}</button>
            </div>
        </div>
    );
};

const ShareModal = ({ user, onClose }) => {
    const profileLink = `guardianlink.app/profile/${user.name.toLowerCase().replace(/\s+/g, '')}`;
    const [copied, setCopied] = useState(false);
    const { t } = useLocalization();

    const handleCopy = () => {
        navigator.clipboard.writeText(profileLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${user.name}'s ${t('appName')} Profile`,
                    text: `Check out my profile on ${t('appName')}.`,
                    url: `https://${profileLink}`,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            alert(t('shareModal.error'));
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('shareModal.title')}</h2>
                    <button onClick={onClose} className="close-btn" aria-label="Close">&times;</button>
                </div>
                <div className="modal-body">
                    <p>{t('shareModal.description')}</p>
                    <div className="share-link-container">
                        <input type="text" value={profileLink} readOnly />
                        <button className="btn btn-secondary" onClick={handleCopy}>
                            {copied ? t('shareModal.copied') : t('shareModal.copy')}
                        </button>
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-primary" onClick={handleShare}>
                        {t('shareModal.shareVia')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const StatusEditModal = ({ currentStatus, onClose, onSave }) => {
    const { t } = useLocalization();
    const [emoji, setEmoji] = useState(currentStatus?.emoji || '😊');
    const [text, setText] = useState(currentStatus?.text || '');

    const handleSave = () => {
        onSave({ emoji, text });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('statusModal.title')}</h2>
                    <button onClick={onClose} className="close-btn" aria-label={t('companionModal.close')}>
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                         <label htmlFor="status-emoji">{t('statusModal.emojiLabel')}</label>
                         <input
                            id="status-emoji"
                            type="text"
                            value={emoji}
                            onChange={(e) => setEmoji(e.target.value)}
                            maxLength="2"
                            className="emoji-input"
                         />
                    </div>
                    <div className="form-group">
                         <label htmlFor="status-text">{t('statusModal.textLabel')}</label>
                         <input
                            id="status-text"
                            type="text"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={t('profile.setStatus')}
                         />
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>{t('statusModal.cancel')}</button>
                    <button type="button" className="btn btn-primary" onClick={handleSave}>
                        {t('statusModal.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};


const SettingsScreen = ({ 
    onBack, onSignOut, settings, setSettings, user, handleUserChange, 
    handleSubmit, profileImage, setProfileImage, setIsCameraOpen, 
    passwords, handlePasswordChange, showToast
}) => {
    const fileInputRef = useRef(null);
    const { t, setLanguage, language } = useLocalization();
    
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfileImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleThemeChange = (theme) => {
        setSettings(prev => ({ ...prev, theme }));
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        const selectedLang = languages.find(l => l.code === newLang);
        showToast(`${t('settings.langChanged')}${selectedLang.name}`);
    };

    const handleNotificationToggle = (key) => {
        setSettings(prev => ({
            ...prev,
            notifications: { ...prev.notifications, [key]: !prev.notifications[key] }
        }));
    };
    
    const handleSignOut = () => {
        if (confirm(t('settings.signOutConfirm'))) {
            onSignOut();
        }
    };

    return (
        <div className="page-content settings-screen">
             <div className="header settings-header">
                <button onClick={onBack} className="icon-btn back-btn" aria-label={t('settings.back')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <h1>{t('settings.title')}</h1>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="settings-section">
                    <h2>{t('settings.profile')}</h2>
                    <div className="profile-image-section">
                        <div className="profile-image-preview" style={{ backgroundImage: `url(${profileImage})` }}>
                            {!profileImage && 
                              <div className="avatar-placeholder-large">
                                <svg width="80" height="80" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <rect x="8" y="8" width="8" height="8" fill="white"/>
                                  <rect x="24" y="8" width="8" height="8" fill="white"/>
                                  <rect x="8" y="24" width="24" height="8" fill="white"/>
                                </svg>
                              </div>
                            }
                        </div>
                        <div className="image-actions">
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                            <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>{t('settings.upload')}</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setIsCameraOpen(true)}>{t('settings.camera')}</button>
                        </div>
                    </div>
                     <div className="form-group">
                      <label htmlFor="name">{t('settings.username')}</label>
                      <input type="text" id="name" name="name" value={user.name} onChange={handleUserChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">{t('settings.email')}</label>
                      <input type="email" id="email" name="email" value={user.email} onChange={handleUserChange} required />
                    </div>
                     <div className="form-group">
                      <label htmlFor="safeword">{t('settings.safeword')}</label>
                      <input type="password" id="safeword" name="safeword" value={user.safeword} onChange={handleUserChange} placeholder={t('settings.safewordPlaceholder')} />
                    </div>
                </div>

                <div className="settings-section">
                    <h2>{t('settings.changePass')}</h2>
                    <div className="form-group">
                        <label htmlFor="current-password">{t('settings.currentPass')}</label>
                        <input type="password" id="current-password" name="current" value={passwords.current} onChange={handlePasswordChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-password">{t('settings.newPass')}</label>
                        <input type="password" id="new-password" name="new" value={passwords.new} onChange={handlePasswordChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirm-password">{t('settings.confirmPass')}</label>
                        <input type="password" id="confirm-password" name="confirm" value={passwords.confirm} onChange={handlePasswordChange} />
                    </div>
                </div>

                <div className="settings-section">
                    <h2>{t('settings.appearance')}</h2>
                    <div className="theme-options">
                        {[
                            { key: 'light', label: t('settings.light') }, 
                            { key: 'dark', label: t('settings.dark') }, 
                            { key: 'automatic', label: t('settings.automatic') }
                        ].map(theme => (
                            <button key={theme.key} type="button" className={`btn ${settings.theme === theme.key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleThemeChange(theme.key)}>
                                {theme.label}
                            </button>
                        ))}
                    </div>
                </div>
                
                 <div className="settings-section">
                    <h2>{t('settings.language')}</h2>
                    <div className="form-group">
                        <select id="language" value={language} onChange={handleLanguageChange} className="settings-select">
                            {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="settings-section">
                    <h2>🤖 AI Guardian Testing</h2>
                    <div className="ai-testing-section">
                        <div className="form-group">
                            <label>Microphone Test</label>
                            <p className="setting-description">Test if your microphone is working properly</p>
                            <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => window.testMicrophone && window.testMicrophone()}
                            >
                                🎤 Test Microphone
                            </button>
                        </div>
                        
                        <div className="form-group">
                            <label>Speech Recognition Test</label>
                            <p className="setting-description">Test speech-to-text conversion and see what the AI hears</p>
                            <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => window.testSpeechRecognition && window.testSpeechRecognition()}
                            >
                                🗣️ Test Speech Recognition
                            </button>
                        </div>
                        
                        <div className="form-group">
                            <label>Distress Detection Test</label>
                            <p className="setting-description">Test if the AI can detect distress phrases</p>
                            <button 
                                type="button" 
                                className="btn btn-secondary"
                                onClick={() => window.testDistressDetection && window.testDistressDetection()}
                            >
                                🚨 Test Distress Detection
                            </button>
                        </div>
                        
                        <div id="ai-test-results" className="test-results" style={{
                            marginTop: '15px',
                            padding: '10px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            display: 'none'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Test Results:</div>
                            <div id="test-log"></div>
                        </div>
                    </div>
                </div>

                <div className="settings-section">
                    <h2>{t('settings.notifications')}</h2>
                    <div className="notification-options">
                        <div className="form-group toggle-group">
                            <div className="toggle-label">
                                <label htmlFor="sos-alerts">{t('settings.sosAlerts')}</label>
                                <p className="setting-description">{t('settings.sosAlertsDesc')}</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" id="sos-alerts" checked={settings.notifications.sos} onChange={() => handleNotificationToggle('sos')} />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="form-group toggle-group">
                             <div className="toggle-label">
                                <label htmlFor="companion-updates">{t('settings.companionUpdates')}</label>
                                <p className="setting-description">{t('settings.companionUpdatesDesc')}</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" id="companion-updates" checked={settings.notifications.companion} onChange={() => handleNotificationToggle('companion')} />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="form-group toggle-group">
                            <div className="toggle-label">
                                <label htmlFor="status-updates">{t('settings.statusUpdates')}</label>
                                <p className="setting-description">{t('settings.statusUpdatesDesc')}</p>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" id="status-updates" checked={settings.notifications.status} onChange={() => handleNotificationToggle('status')} />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="footer">
                    <button type="submit" className="btn btn-primary">{t('settings.save')}</button>
                </div>
            </form>
            <div className="settings-footer">
                <button className="btn btn-danger sign-out-btn" onClick={handleSignOut}>{t('settings.signOut')}</button>
            </div>
        </div>
    );
};

const ProfileImageModal = ({ user, profileImage, onClose }) => {
    const { t } = useLocalization();

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div className="image-modal-overlay" onClick={onClose}>
            <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="image-modal-close-btn" aria-label={t('companionModal.close')}>
                    &times;
                </button>
                <div className="enlarged-profile-image" style={{ backgroundImage: `url(${profileImage})` }}>
                     {!profileImage && 
                        <div className="avatar-placeholder-large">
                            <svg width="80" height="80" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="8" y="8" width="8" height="8" fill="white"/>
                                <rect x="24" y="8" width="8" height="8" fill="white"/>
                                <rect x="8" y="24" width="24" height="8" fill="white"/>
                            </svg>
                        </div>
                     }
                </div>
                <div className="image-modal-info">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                </div>
            </div>
        </div>
    );
};


const ProfileScreen = ({ user, profileImage, onNavigateToSettings, onStatusUpdate }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isImageModalVisible, setIsImageModalVisible] = useState(false);
    const { t } = useLocalization();

    return (
        <div className="page-content profile-screen">
             <div className="profile-header">
                <div className="profile-header-actions">
                    <button className="icon-btn" onClick={onNavigateToSettings} aria-label={t('profile.settings')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    </button>
                     <button className="icon-btn" onClick={() => setIsShareModalOpen(true)} aria-label={t('profile.share')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                    </button>
                </div>
            </div>

            <div className="profile-main-info">
                 <button className="profile-avatar-btn" onClick={() => setIsImageModalVisible(true)} aria-label={t('profile.viewPicture')}>
                    <div className="profile-avatar" style={{backgroundImage: `url(${profileImage})`}}>
                      {!profileImage && 
                        <div className="avatar-placeholder">
                          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="8" y="8" width="8" height="8" fill="white"/>
                            <rect x="24" y="8" width="8" height="8" fill="white"/>
                            <rect x="8" y="24" width="24" height="8" fill="white"/>
                          </svg>
                        </div>
                      }
                    </div>
                </button>
                <span className="profile-username">{user.name}</span>
            </div>

            <button className="status-bar" onClick={() => setIsStatusModalOpen(true)}>
                <span className="status-emoji">{user.status?.emoji || '😊'}</span>
                <span className="status-text">{user.status?.text || t('profile.setStatus')}</span>
                <span className="status-edit-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V12h2.293l6.5-6.5z"/></svg>
                </span>
            </button>
            {isShareModalOpen && <ShareModal user={user} onClose={() => setIsShareModalOpen(false)} />}
            {isStatusModalOpen && (
              <StatusEditModal
                currentStatus={user.status}
                onClose={() => setIsStatusModalOpen(false)}
                onSave={(newStatus) => {
                  onStatusUpdate(newStatus);
                  setIsStatusModalOpen(false);
                }}
              />
            )}
            {isImageModalVisible && (
              <ProfileImageModal
                user={user}
                profileImage={profileImage}
                onClose={() => setIsImageModalVisible(false)}
              />
            )}
        </div>
    );
};

const BottomNavBar = ({ activeTab, setActiveTab }) => {
    const { t } = useLocalization();
    const navItems = [
        { id: 'home', label: t('nav.home'), icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> },
        { id: 'contacts', label: t('nav.contacts'), icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><circle cx="12" cy="10" r="2"></circle><line x1="8" x2="8" y1="2" y2="4"></line><line x1="16" x2="16" y1="2" y2="4"></line></svg> },
        { id: 'map', label: t('nav.map'), icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> },
        { id: 'history', label: t('nav.history'), icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M12 8v4l2 2"></path></svg> },
        { id: 'profile', label: t('nav.profile'), icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg> },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                    aria-label={item.label}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

const MapScreen = ({ sharedSessions, isMapScriptLoaded, currentPosition, user, profileImage }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const { t } = useLocalization();

  useEffect(() => {
    if (!isMapScriptLoaded || map.current) return;
    
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    if (!apiKey) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${apiKey}`,
      center: [0, 0],
      zoom: 2,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      // Clean up markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      
      // Clean up map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isMapScriptLoaded]);

  // Update markers when sessions or current position change
  useEffect(() => {
    if (!map.current) return;
    
    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
    
    // Add current user marker if position is available
    if (currentPosition) {
      const userMarker = createCustomMarker({
        name: user.name || 'You',
        profileImage: profileImage,
        isCurrentUser: true
      }, [currentPosition.lng, currentPosition.lat]);
      
      userMarker.addTo(map.current);
      markers.current.push(userMarker);
    }
    
    // Add markers for shared sessions
    sharedSessions.forEach(session => {
      if (session.latestLocation) {
        const companionMarker = createCustomMarker({
          name: session.user?.fullName || 'Unknown',
          profileImage: null, // Would need to fetch profile images
          isCurrentUser: false,
          isSos: session.isSosTriggered
        }, [session.latestLocation.longitude, session.latestLocation.latitude]);
        
        companionMarker.addTo(map.current);
        markers.current.push(companionMarker);
      }
    });
    
    // Fit map to show all markers
    if (markers.current.length > 0) {
      const coordinates = markers.current.map(marker => marker.getLngLat());
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 16,
        duration: 1000
      });
    }
  }, [sharedSessions, currentPosition, user, profileImage]);

  // Periodically update location data for shared sessions (every 5 seconds)
  useEffect(() => {
    if (sharedSessions.length === 0) return;
    
    const updateLocations = async () => {
      // This would fetch updated location data for each session
      // For now, we rely on the polling in the App component
    };
    
    const interval = setInterval(updateLocations, 5000);
    return () => clearInterval(interval);
  }, [sharedSessions]);

  const createCustomMarker = (userData, coordinates) => {
    const el = document.createElement('div');
    el.className = 'companion-marker';
    
    // Create marker container
    const markerContainer = document.createElement('div');
    markerContainer.className = `companion-marker-container ${userData.isCurrentUser ? 'current-user' : ''} ${userData.isSos ? 'sos-alert' : ''}`;
    
    // Create profile image or avatar
    const profileElement = document.createElement('div');
    profileElement.className = 'companion-marker-profile';
    
    if (userData.profileImage) {
      profileElement.style.backgroundImage = `url(${userData.profileImage})`;
    } else {
      // Create initials avatar
      const initials = userData.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      profileElement.textContent = initials;
      profileElement.className += ' companion-marker-initials';
    }
    
    // Create name label
    const nameLabel = document.createElement('div');
    nameLabel.className = 'companion-marker-name';
    nameLabel.textContent = userData.name;
    
    // Create pin
    const pinElement = document.createElement('div');
    pinElement.className = 'companion-marker-pin';
    
    markerContainer.appendChild(profileElement);
    markerContainer.appendChild(nameLabel);
    markerContainer.appendChild(pinElement);
    el.appendChild(markerContainer);
    
    return new maplibregl.Marker({
      element: el,
      anchor: 'bottom'
    }).setLngLat(coordinates);
  };

  return (
    <div className="page-content">
      <div className="header">
        <h1>{t('map.title')}</h1>
        <p>{t('map.description')}</p>
      </div>
      
      <div className="map-screen-container">
        {isMapScriptLoaded ? (
          <div ref={mapContainer} className="map-screen" />
        ) : (
          <div className="map-placeholder">
            <p>{t('home.mapLoading')}</p>
          </div>
        )}
        
        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-marker current-user"></div>
            <span>{t('map.you')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker companion"></div>
            <span>{t('map.companions')}</span>
          </div>
          <div className="legend-item">
            <div className="legend-marker sos"></div>
            <span>{t('map.sosAlerts')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="toast-notification">
            <p>{message}</p>
            <button onClick={onClose}>&times;</button>
        </div>
    );
};

const App = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState({
    name: '',
    email: '',
    safeword: '',
    status: { emoji: '😊', text: '' }
  });
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [profileImage, setProfileImage] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [contacts, setContacts] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);

  const [isElderlyMode, setIsElderlyMode] = useState(false);
  const [companionSession, setCompanionSession] = useState({
    isActive: false,
    sharedWith: [],
    endTime: null,
    sessionId: null
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isMapScriptLoaded, setIsMapScriptLoaded] = useState(false);
  const watchIdRef = useRef(null);

  const [isSosActive, setIsSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(null);
  const countdownTimerRef = useRef(null);
  const sosActivationTimeoutRef = useRef(null);
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const [showSafewordModal, setShowSafewordModal] = useState(false);
  const [showExpandedMap, setShowExpandedMap] = useState(false);
  const [expandedMapLocation, setExpandedMapLocation] = useState(null);
  
  const [toastMessage, setToastMessage] = useState('');
  const [sharedSessions, setSharedSessions] = useState([]); // Sessions shared with me
  const [notifications, setNotifications] = useState([]); // In-app notifications

  const [profileSubScreen, setProfileSubScreen] = useState('main');
  const [settings, setSettings] = useState({
      theme: 'automatic',
      notifications: {
          sos: true,
          companion: true,
          status: true,
      }
  });

  // AI Distress Detection State
  const [distressManager, setDistressManager] = useState(null);
  const [isDistressMonitoring, setIsDistressMonitoring] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [microphonePermission, setMicrophonePermission] = useState('prompt');
  const [speechFeedback, setSpeechFeedback] = useState({ text: '', confidence: 0, isFinal: false, visible: false });

  const { t } = useLocalization();

  // Load user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await userAPI.getProfile();
        setUser({
          name: profile.fullName,
          email: profile.email,
          safeword: profile.safeword || '',
          status: {
            emoji: profile.statusEmoji || '😊',
            text: profile.statusText || ''
          }
        });
        if (profile.profileImageUrl) {
          setProfileImage(profile.profileImageUrl);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        // If unauthorized, sign out
        if (error.message && error.message.includes('401')) {
          storage.clearAll();
          onSignOut();
        }
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUserProfile();
  }, [onSignOut]);

  // Load emergency contacts on mount
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const contactsData = await contactsAPI.getContacts();
        setContacts(contactsData.map(c => ({
          id: c.id,
          name: c.fullName,
          phone: c.phoneNumber,
          email: c.email
        })));
      } catch (error) {
        console.error('Failed to load contacts:', error);
      } finally {
        setIsLoadingContacts(false);
      }
    };

    loadContacts();
  }, []);

  // Load active companion session on mount
  useEffect(() => {
    const loadActiveCompanionSession = async () => {
      try {
        console.log('🔍 Checking for active companion session...');
        const response = await companionAPI.getActiveSession();
        
        if (response && response.isActive) {
          console.log('✅ Found active companion session:', response);
          
          setCompanionSession({
            isActive: true,
            sharedWith: response.sharedWithContacts?.map(c => c.name) || [],
            endTime: new Date(response.endTime).getTime(),
            sessionId: response.id
          });
          
          showToast('🔄 Companion mode resumed - you are sharing your location');
        } else {
          console.log('ℹ️ No active companion session found');
        }
      } catch (error) {
        console.error('Failed to load active companion session:', error);
        // Don't show error to user as this is not critical
      }
    };

    // Only check after user is loaded
    if (user.email && !isLoadingUser) {
      loadActiveCompanionSession();
    }
  }, [user.email, isLoadingUser]);

  // Poll for sessions shared with me (every 10 seconds)
  useEffect(() => {
    const checkSharedSessions = async () => {
      try {
        const sessions = await companionAPI.getSharedWithMe();
        
        // Check for new sessions and create notifications
        // Only show sessions from OTHER users (not my own sessions)
        sessions.forEach(session => {
          const isNew = !sharedSessions.find(s => s.id === session.id);
          const isMyOwnSession = session.user?.email === user.email; // Filter out my own sessions
          
          if (isNew && !isMyOwnSession) {
            const notification = {
              id: `session-${session.id}`,
              type: session.isSosTriggered ? 'sos' : 'companion',
              user: session.user?.fullName || 'Someone',
              sessionId: session.id,
              timestamp: new Date().toISOString()
            };
            setNotifications(prev => [notification, ...prev]);
          }
        });
        
        setSharedSessions(sessions);
      } catch (error) {
        console.error('Failed to load shared sessions:', error);
      }
    };

    // Initial check
    checkSharedSessions();

    // Poll every 5 seconds (faster for emergency app)
    const interval = setInterval(checkSharedSessions, 5000);

    return () => clearInterval(interval);
  }, [sharedSessions, user.email]);

  useEffect(() => {
    const applyTheme = (theme) => {
      document.body.classList.remove('light-mode', 'dark-mode');
      if (theme !== 'automatic') {
        document.body.classList.add(`${theme}-mode`);
      }
    };
  
    if (settings.theme === 'automatic') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const handleChange = () => {
        applyTheme(mediaQuery.matches ? 'light' : 'dark');
      };
      mediaQuery.addEventListener('change', handleChange);
      handleChange(); 
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(settings.theme);
    }
  }, [settings.theme]);


  useEffect(() => {
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
    
    // MapTiler doesn't need script loading - just set loaded state
    if (apiKey) {
      setIsMapScriptLoaded(true);
    } else {
      console.warn('MapTiler API key not configured. Map features will be limited.');
      setIsMapScriptLoaded(false);
    }
  }, []);

  useEffect(() => {
    if (companionSession.isActive && companionSession.endTime) {
        console.log('⏰ Starting companion session timer', {
          endTime: new Date(companionSession.endTime),
          sessionId: companionSession.sessionId
        });
        
        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.round((companionSession.endTime - now) / 1000);
            if (remaining > 0) {
                setTimeLeft(remaining);
            } else {
                console.log('⏰ Companion session expired, stopping...');
                setTimeLeft(0);
                stopCompanionMode();
            }
        };

        const intervalId = setInterval(updateTimer, 1000);
        updateTimer();

        return () => clearInterval(intervalId);
    }
  }, [companionSession.isActive, companionSession.endTime]);

  // Auto-initialize distress detection when app loads
  useEffect(() => {
    const autoInitDistressDetection = async () => {
      // Initialize if user is logged in (contacts are not required for AI detection)
      if (user.email) {
        // Small delay to ensure app is fully loaded
        setTimeout(() => {
          initializeDistressDetection();
        }, 2000);
      }
    };
    
    autoInitDistressDetection();
    
    // Cleanup on unmount
    return () => {
      if (distressManager) {
        console.log('🧹 Cleaning up distress detection on unmount');
        stopDistressDetection();
      }
    };
  }, [user.email]); // Removed contacts.length dependency

  // AI Testing Functions for Settings
  const setupAITestingFunctions = () => {
    // Microphone Test Function
    window.testMicrophone = async () => {
      const testResults = document.getElementById('ai-test-results');
      const testLog = document.getElementById('test-log');
      
      if (testResults) testResults.style.display = 'block';
      if (testLog) testLog.innerHTML = '';
      
      const addTestLog = (message) => {
        if (testLog) {
          testLog.innerHTML += `[${new Date().toLocaleTimeString()}] ${message}<br>`;
          testLog.scrollTop = testLog.scrollHeight;
        }
      };
      
      try {
        addTestLog('🎤 Testing microphone access...');
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        addTestLog('✅ Microphone access granted');
        
        // Test audio levels
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        addTestLog('🔊 Monitoring audio levels for 5 seconds...');
        addTestLog('💬 Please speak into your microphone');
        
        let maxVolume = 0;
        const startTime = Date.now();
        
        const checkAudio = () => {
          analyser.getByteFrequencyData(dataArray);
          const volume = Math.max(...dataArray);
          maxVolume = Math.max(maxVolume, volume);
          
          if (Date.now() - startTime < 5000) {
            setTimeout(checkAudio, 100);
          } else {
            stream.getTracks().forEach(track => track.stop());
            audioContext.close();
            
            if (maxVolume > 50) {
              addTestLog(`✅ Microphone working! Max volume detected: ${maxVolume}`);
            } else {
              addTestLog(`⚠️ Low audio detected. Max volume: ${maxVolume}. Check microphone settings.`);
            }
          }
        };
        
        checkAudio();
        
      } catch (error) {
        addTestLog(`❌ Microphone test failed: ${error.message}`);
      }
    };
    
    // Speech Recognition Test Function
    window.testSpeechRecognition = async () => {
      const testResults = document.getElementById('ai-test-results');
      const testLog = document.getElementById('test-log');
      
      if (testResults) testResults.style.display = 'block';
      if (testLog) testLog.innerHTML = '';
      
      const addTestLog = (message) => {
        if (testLog) {
          testLog.innerHTML += `[${new Date().toLocaleTimeString()}] ${message}<br>`;
          testLog.scrollTop = testLog.scrollHeight;
        }
      };
      
      try {
        addTestLog('🗣️ Testing speech recognition...');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          addTestLog('❌ Speech recognition not supported in this browser');
          return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        addTestLog('✅ Speech recognition initialized');
        addTestLog('🎙️ Listening for 10 seconds... Please speak!');
        
        recognition.onresult = (event) => {
          const results = event.results;
          const lastResult = results[results.length - 1];
          const transcript = lastResult[0].transcript;
          const confidence = lastResult[0].confidence || 0;
          const isFinal = lastResult.isFinal;
          
          addTestLog(`${isFinal ? '📝' : '⏳'} ${isFinal ? 'Final' : 'Interim'}: "${transcript}" (${Math.round(confidence * 100)}%)`);
        };
        
        recognition.onerror = (event) => {
          addTestLog(`❌ Speech recognition error: ${event.error}`);
        };
        
        recognition.onend = () => {
          addTestLog('🏁 Speech recognition test completed');
        };
        
        recognition.start();
        
        // Stop after 10 seconds
        setTimeout(() => {
          recognition.stop();
        }, 10000);
        
      } catch (error) {
        addTestLog(`❌ Speech recognition test failed: ${error.message}`);
      }
    };
    
    // Distress Detection Test Function
    window.testDistressDetection = async () => {
      const testResults = document.getElementById('ai-test-results');
      const testLog = document.getElementById('test-log');
      
      if (testResults) testResults.style.display = 'block';
      if (testLog) testLog.innerHTML = '';
      
      const addTestLog = (message) => {
        if (testLog) {
          testLog.innerHTML += `[${new Date().toLocaleTimeString()}] ${message}<br>`;
          testLog.scrollTop = testLog.scrollHeight;
        }
      };
      
      try {
        addTestLog('🚨 Testing distress detection...');
        
        // Import the classification service
        const { DistressClassificationService } = await import('./src/distress-detection/services/DistressClassificationService.js');
        const classifier = new DistressClassificationService();
        
        addTestLog('✅ Distress classifier loaded');
        
        // Test phrases
        const testPhrases = [
          'Hello how are you today',
          'help me please',
          'I am scared',
          'stop it please',
          'call the police',
          'everything is fine',
          'no please dont',
          'I need assistance'
        ];
        
        addTestLog('🔍 Testing phrases for distress detection...');
        
        for (const phrase of testPhrases) {
          const analysis = await classifier.analyzeText(phrase);
          const status = analysis.isDistress ? '🚨 DISTRESS' : '✅ SAFE';
          addTestLog(`${status} "${phrase}" - ${analysis.confidence}% confidence`);
          
          if (analysis.detectedPhrases.length > 0) {
            addTestLog(`   └─ Detected: [${analysis.detectedPhrases.join(', ')}]`);
          }
        }
        
        addTestLog('🏁 Distress detection test completed');
        
      } catch (error) {
        addTestLog(`❌ Distress detection test failed: ${error.message}`);
      }
    };
    
    // Speech Feedback Function (for real-time display)
    window.showSpeechFeedback = (text, confidence, isFinal) => {
      setSpeechFeedback({
        text,
        confidence: Math.round(confidence * 100),
        isFinal,
        visible: true
      });
      
      // Hide after 3 seconds if final, or 1 second if interim
      setTimeout(() => {
        setSpeechFeedback(prev => ({ ...prev, visible: false }));
      }, isFinal ? 3000 : 1000);
    };
  };
  
  // Set up testing functions when component mounts
  useEffect(() => {
    setupAITestingFunctions();
  }, []);

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUser(prevUser => ({ ...prevUser, [name]: value }));
  };
  
  const handlePasswordChange = (e) => {
      const { name, value } = e.target;
      setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (id, e) => {
    const { name, value } = e.target;
    setContacts(prevContacts => 
      prevContacts.map(contact => 
        contact.id === id ? { ...contact, [name]: value } : contact
      )
    );
  };

  const addContact = () => {
    const newId = Date.now(); // Temporary ID
    setContacts([...contacts, { id: newId, name: '', phone: '', email: '' }]);
  };

  const removeContact = async (id) => {
    try {
      // Only try to delete from backend if it's a real ID (not temporary)
      if (id < Date.now() - 100000) {
        await contactsAPI.deleteContact(id);
      }
      setContacts(contacts.filter(contact => contact.id !== id));
      showToast('Contact removed');
    } catch (error) {
      console.error('Failed to delete contact:', error);
      showToast('Failed to delete contact');
    }
  };

  // Save contact to backend
  const saveContact = async (contact) => {
    try {
      if (!contact.name || !contact.phone || !contact.email) {
        return; // Don't save incomplete contacts
      }

      // Check if this is a new contact (temporary ID)
      if (contact.id >= Date.now() - 100000) {
        const result = await contactsAPI.addContact(
          contact.name,
          contact.phone,
          contact.email
        );
        // Update with real ID from backend
        setContacts(prev => prev.map(c => 
          c.id === contact.id ? { ...c, id: result.id } : c
        ));
        showToast('Contact added successfully!');
      } else {
        await contactsAPI.updateContact(
          contact.id,
          contact.name,
          contact.phone,
          contact.email
        );
        showToast('Contact updated');
      }
    } catch (error) {
      console.error('Failed to save contact:', error);
      showToast('Failed to save contact');
    }
  };

  const handleStatusUpdate = (newStatus) => {
    setUser(prev => ({...prev, status: newStatus}));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await userAPI.updateProfile({
        fullName: user.name,
        safeword: user.safeword,
        statusEmoji: user.status.emoji,
        statusText: user.status.text,
        theme: settings.theme,
        sosAlertsEnabled: settings.notifications.sos,
        companionUpdatesEnabled: settings.notifications.companion,
        statusUpdatesEnabled: settings.notifications.status,
      });
      
      showToast(t('settings.saveSuccess'));
      setProfileSubScreen('main');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save settings');
    }
  };
  
  const handleStartCompanionMode = async (selectedContactIds, durationInMinutes) => {
    // Show immediate feedback to user
    showToast('Starting companion mode...');
    
    // Use high accuracy and shorter timeout for faster response
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds instead of default 30+
      maximumAge: 60000 // Accept location up to 1 minute old
    };
    
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
            const { latitude, longitude } = position.coords;
            
            // Start companion mode via API
            const response = await companionAPI.startCompanion(
                latitude,
                longitude,
                durationInMinutes,
                selectedContactIds
            );
            
            const durationInSeconds = durationInMinutes * 60;
            const endTime = Date.now() + durationInSeconds * 1000;
            
            const sharedWithNames = contacts
                .filter(c => selectedContactIds.includes(c.id))
                .map(c => c.name);

            setCompanionSession({
                isActive: true,
                sharedWith: sharedWithNames,
                endTime: endTime,
                sessionId: response.sessionId
            });

            setTimeLeft(durationInSeconds);
            
            const coords = { lat: latitude, lng: longitude };
            setCurrentPosition(coords);
            
            // Show success message
            showToast(`Companion mode activated! Sharing location for ${durationInMinutes} minutes.`);

            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }

            watchIdRef.current = navigator.geolocation.watchPosition(
                async (newPosition) => {
                    const newCoords = {
                        lat: newPosition.coords.latitude,
                        lng: newPosition.coords.longitude,
                    };
                    setCurrentPosition(newCoords);
                    
                    // Update location on backend
                    try {
                        await companionAPI.updateLocation(
                            response.sessionId,
                            newCoords.lat,
                            newCoords.lng
                        );
                    } catch (error) {
                        console.error('Failed to update location:', error);
                    }
                },
                (error) => {
                    console.error("Geolocation watch error:", error);
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
            );
        } catch (error: any) {
            console.error('Failed to start companion mode:', error);
            
            // Check if there's an existing session
            if (error.existingSession) {
                const shouldStop = confirm(
                    `You already have an active companion session${error.existingSession.isSosTriggered ? ' (from SOS alert)' : ''}. Would you like to stop it and start a new one?`
                );
                
                if (shouldStop) {
                    try {
                        await companionAPI.stopCompanion(error.existingSession.id);
                        // Retry starting companion mode
                        handleStartCompanionMode(selectedContactIds, durationInMinutes);
                    } catch (stopError) {
                        console.error('Failed to stop existing session:', stopError);
                        alert('Failed to stop existing session. Please try again.');
                    }
                }
            } else {
                alert('Failed to start companion mode. Please try again.');
            }
        }
    }, (error) => {
        console.error("Geolocation error:", error);
        showToast("Could not get your location. Please enable location services and try again.");
    }, geoOptions);
  };

  const stopCompanionMode = async () => {
    try {
        if (companionSession.sessionId) {
            await companionAPI.stopCompanion(companionSession.sessionId);
        }
    } catch (error) {
        console.error('Failed to stop companion mode on backend:', error);
    }
    
    if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
    }
    setCurrentPosition(null);
    setCompanionSession({
        isActive: false,
        sharedWith: [],
        endTime: null,
        sessionId: null
    });
    setTimeLeft(0);
    console.log('Companion Mode stopped.');
  };

  const handleStartSos = () => {
    setSosCountdown(5);
    countdownTimerRef.current = setInterval(() => {
        setSosCountdown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    sosActivationTimeoutRef.current = setTimeout(() => {
        clearInterval(countdownTimerRef.current);
        setSosCountdown(null);
        
        // Get current location and activate SOS
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const contactIds = contacts.map(c => c.id);
                
                // Activate SOS via API
                await sosAPI.activateSOS(latitude, longitude, contactIds);
                
                setIsSosActive(true);
                
                document.body.classList.add('sos-flash');
                setTimeout(() => document.body.classList.remove('sos-flash'), 500);
            } catch (error) {
                console.error('Failed to activate SOS:', error);
                alert('Failed to activate SOS alert. Emergency contacts will not be notified.');
                setIsSosActive(true); // Still activate locally
            }
        }, (error) => {
            console.error('Geolocation error:', error);
            alert('Could not get your location for SOS alert.');
        });
    }, 5000);
  };

  const handleCancelSos = () => {
      clearInterval(countdownTimerRef.current);
      clearTimeout(sosActivationTimeoutRef.current);
      setSosCountdown(null);
  };

  const handleExpandMap = (location) => {
    setExpandedMapLocation(location);
    setShowExpandedMap(true);
  };

  const handleCloseExpandedMap = () => {
    setShowExpandedMap(false);
    setExpandedMapLocation(null);
  };

  const handleMarkSafe = () => {
      // Open safeword verification modal instead of directly marking safe
      setShowSafewordModal(true);
  };

  const handleSafewordVerified = async (safeword) => {
      try {
          // Call backend to mark as safe with safeword
          await sosAPI.markSafe(safeword);
          setShowSafewordModal(false);
          setIsSosActive(false);
          showToast('Marked as safe successfully');
      } catch (error) {
          console.error('Failed to mark safe:', error);
          // Don't close modal on error - let the modal handle it
          throw error; // Re-throw to let modal component handle the error
      }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  
  const handleCapturePhoto = (imageDataUrl) => {
      setProfileImage(imageDataUrl);
      setIsCameraOpen(false);
  }
  
  const showToast = (message) => {
    setToastMessage(message);
  }

  // AI Distress Detection Functions
  const initializeDistressDetection = async () => {
    try {
      console.log('🤖 Initializing AI Distress Detection...');
      
      // Check microphone permission first
      const permissionManager = new PermissionsManager();
      const hasPermission = await permissionManager.requestMicrophonePermission();
      
      if (!hasPermission) {
        setMicrophonePermission('denied');
        showToast('Microphone access is required for AI distress detection. Please enable it in your browser settings.');
        return false;
      }
      
      setMicrophonePermission('granted');
      
      // Initialize the distress detection manager
      const manager = new DistressDetectionManager();
      
      // Enable the system by updating settings
      manager.updateSettings({
        enabled: true,
        speechRecognition: {
          enabled: true,
          sensitivity: 70,
          language: 'en-US',
          continuousMode: true,
        },
        audioAnalysis: {
          enabled: true,
          volumeThreshold: 80,
          spikeDetection: true,
          frequencyAnalysis: true,
        },
        nlpProcessing: {
          mode: 'local',
          confidenceThreshold: 60, // Lower threshold for better detection
          customPhrases: [],
        },
        verification: {
          timeoutSeconds: 10,
          showCountdown: true,
          requireExplicitConfirmation: false,
        },
        privacy: {
          storeAudioLocally: false,
          sendToAPI: false,
          dataRetentionDays: 7,
        },
      });
      
      // Set up distress detection callbacks
      manager.onDistressDetected((context) => {
        console.log('🚨 Distress detected:', context);
        
        setVerificationData({
          detectionSource: context.detectionMethod,
          confidence: Math.round(context.confidence),
          transcript: context.transcript,
          audioMetrics: context.audioMetrics,
          timestamp: new Date(),
          context: context // Store the full context for verification result handling
        });
        
        setShowVerificationDialog(true);
      });
      
      // Start monitoring (this also initializes the services)
      await manager.startMonitoring();
      setDistressManager(manager);
      setIsDistressMonitoring(true);
      
      showToast('🤖 AI Distress Detection is now active and listening...');
      console.log('✅ AI Distress Detection initialized successfully');
      
      // Add state change listener for debugging
      manager.onStateChange((state) => {
        console.log('🔄 AI Detection State Changed:', state);
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize distress detection:', error);
      showToast('Failed to initialize AI distress detection: ' + error.message);
      return false;
    }
  };
  
  const stopDistressDetection = async () => {
    if (distressManager) {
      try {
        console.log('🛑 Stopping AI Distress Detection...');
        distressManager.destroy();
        setDistressManager(null);
        setIsDistressMonitoring(false);
        setMicrophonePermission('prompt'); // Reset permission state
        showToast('AI Distress Detection stopped');
        console.log('✅ AI Distress Detection stopped successfully');
      } catch (error) {
        console.error('Error stopping distress detection:', error);
        showToast('Error stopping AI Distress Detection: ' + error.message);
      }
    }
  };
  
  const handleVerificationResult = async (result) => {
    setShowVerificationDialog(false);
    
    const shouldTriggerSOS = result.action === 'confirm' || result.action === 'timeout';
    
    // Notify the distress manager about the verification result
    if (distressManager && verificationData?.context) {
      distressManager.handleExternalVerificationResult(
        result,
        shouldTriggerSOS,
        verificationData.context
      );
    }
    
    if (shouldTriggerSOS) {
      // User confirmed distress or didn't respond (timeout)
      console.log('🚨 Triggering SOS due to confirmed distress');
      
      try {
        // Get current location
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Trigger SOS with AI detection context
          const distressContext = {
            detectionMethod: verificationData.detectionSource,
            confidence: verificationData.confidence,
            transcript: verificationData.transcript,
            timestamp: verificationData.timestamp,
            audioMetrics: verificationData.audioMetrics
          };
          
          const contactIds = contacts.length > 0 ? contacts.map(c => c.id) : [];
          const response = await sosAPI.activateSOSWithDistress(
            latitude, 
            longitude, 
            distressContext, 
            contactIds
          );
          
          if (response.success) {
            setIsSosActive(true);
            showToast('🚨 SOS activated due to AI-detected distress!');
            
            // Automatically start companion mode if contacts exist
            if (contacts.length > 0) {
              handleStartCompanionMode(contacts.map(c => c.id), 60);
            }
          }
        }, (error) => {
          console.error('Geolocation error:', error);
          showToast('Could not get location for SOS. Please try manual SOS.');
        });
      } catch (error) {
        console.error('Failed to activate SOS:', error);
        showToast('Failed to activate SOS: ' + error.message);
      }
    } else {
      // User dismissed as false alarm
      console.log('✅ User dismissed distress detection as false alarm');
      showToast('Distress detection dismissed. Continuing to monitor...');
    }
    
    setVerificationData(null);
  };

  const renderActiveTab = () => {
    switch(activeTab) {
      case 'contacts':
        return <ContactsScreen 
                contacts={contacts}
                handleContactChange={handleContactChange}
                addContact={addContact}
                removeContact={removeContact}
                saveContact={saveContact}
                />;
      case 'map':
        return <MapScreen 
                sharedSessions={sharedSessions}
                isMapScriptLoaded={isMapScriptLoaded}
                currentPosition={currentPosition}
                user={user}
                profileImage={profileImage}
                />;
      case 'history':
        return <HistoryScreen onViewLocation={handleExpandMap} />;
      case 'profile':
        if (profileSubScreen === 'settings') {
            return <SettingsScreen 
                onBack={() => setProfileSubScreen('main')}
                onSignOut={onSignOut}
                settings={settings}
                setSettings={setSettings}
                user={user}
                handleUserChange={handleUserChange}
                handleSubmit={handleSubmit}
                profileImage={profileImage}
                setProfileImage={setProfileImage}
                setIsCameraOpen={setIsCameraOpen}
                passwords={passwords}
                handlePasswordChange={handlePasswordChange}
                showToast={showToast}
            />;
        }
        return <ProfileScreen 
                user={user}
                profileImage={profileImage}
                onNavigateToSettings={() => setProfileSubScreen('settings')}
                onStatusUpdate={handleStatusUpdate}
                />;
      case 'home':
      default:
        return <HomeScreen 
                isElderlyMode={isElderlyMode}
                setIsElderlyMode={setIsElderlyMode}
                isSosActive={isSosActive}
                companionSession={companionSession}
                handleStartSos={handleStartSos}
                handleCancelSos={handleCancelSos}
                handleMarkSafe={handleMarkSafe}
                sosCountdown={sosCountdown}
                timeLeft={timeLeft}
                formatTime={formatTime}
                isMapScriptLoaded={isMapScriptLoaded}
                currentPosition={currentPosition}
                stopCompanionMode={stopCompanionMode}
                onOpenCompanionModal={() => setShowCompanionModal(true)}
                onExpandMap={handleExpandMap}
                isDistressMonitoring={isDistressMonitoring}
                microphonePermission={microphonePermission}
                initializeDistressDetection={initializeDistressDetection}
                stopDistressDetection={stopDistressDetection}
                />;
    }
  };

  return (
    <>
      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map(notif => (
            <div key={notif.id} className={`notification ${notif.type}`}>
              <div className="notification-content">
                <span className="notification-icon">
                  {notif.type === 'sos' ? '🚨' : '📍'}
                </span>
                <div className="notification-text">
                  <strong>{notif.type === 'sos' ? 'SOS ALERT' : 'Location Sharing'}</strong>
                  <p>{notif.user} {notif.type === 'sos' ? 'needs help!' : 'is sharing their location with you'}</p>
                </div>
              </div>
              <button 
                className="notification-close"
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={`container ${isElderlyMode ? 'elderly-mode' : ''}`}>
        {renderActiveTab()}
      </div>
      {isCameraOpen && <CameraView onCapture={handleCapturePhoto} onClose={() => setIsCameraOpen(false)} />}
      {showCompanionModal && (
        <CompanionModeModal
          contacts={contacts}
          onClose={() => setShowCompanionModal(false)}
          onStart={(selectedContactIds, duration) => {
            handleStartCompanionMode(selectedContactIds, duration);
            setShowCompanionModal(false);
          }}
        />
      )}
      {showSafewordModal && (
        <SafewordVerificationModal
          onClose={() => setShowSafewordModal(false)}
          onVerify={handleSafewordVerified}
          userSafeword={user.safeword || ''}
        />
      )}
      {showExpandedMap && expandedMapLocation && (
        <FullScreenMapView
          center={expandedMapLocation}
          onClose={handleCloseExpandedMap}
        />
      )}
      
      {/* AI Distress Detection Verification Dialog */}
      {showVerificationDialog && verificationData && (
        <VerificationDialog
          isVisible={showVerificationDialog}
          detectionSource={verificationData.detectionSource}
          confidence={verificationData.confidence}
          transcript={verificationData.transcript}
          audioMetrics={verificationData.audioMetrics}
          onResult={handleVerificationResult}
          timeoutSeconds={10}
        />
      )}
      
      {/* Speech Feedback Widget */}
      {speechFeedback.visible && isDistressMonitoring && (
        <div className="speech-feedback-widget" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: speechFeedback.isFinal ? '#28a745' : '#ffc107',
          color: speechFeedback.isFinal ? 'white' : '#212529',
          padding: '10px 15px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxWidth: '300px',
          fontSize: '14px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>
              {speechFeedback.isFinal ? '🎤' : '⏳'}
            </span>
            <div>
              <div style={{ fontWeight: 'bold' }}>
                {speechFeedback.isFinal ? 'Heard:' : 'Listening...'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                "{speechFeedback.text}" ({speechFeedback.confidence}%)
              </div>
            </div>
          </div>
        </div>
      )}
      
      <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  );
};

// Public Tracking Page (no authentication required)
const PublicTrackingPage = ({ sessionId }) => {
  const [sessionInfo, setSessionInfo] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const loadSessionInfo = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/companion/track/${sessionId}`);
        
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Session not found');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setSessionInfo(data);
        
        // Load initial location
        loadLocation();
      } catch (err) {
        setError('Failed to load tracking information');
        setIsLoading(false);
      }
    };

    const loadLocation = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/companion/track/${sessionId}/location`);
        
        if (response.ok) {
          const data = await response.json();
          setLocation(data);
          setShowMap(true);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load location:', err);
        setIsLoading(false);
      }
    };

    loadSessionInfo();

    // Poll for location updates every 5 seconds
    const interval = setInterval(loadLocation, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const formatTimeRemaining = () => {
    if (!sessionInfo) return '';
    const now = new Date();
    const end = new Date(sessionInfo.endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (isLoading) {
    return (
      <div className="public-tracking-page">
        <div className="tracking-container">
          <div className="spinner" style={{margin: '2rem auto'}}></div>
          <p style={{textAlign: 'center', color: 'var(--text-secondary)'}}>Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-tracking-page">
        <div className="tracking-container">
          <div className="tracking-error">
            <h1>❌ {error}</h1>
            <p>This tracking link may have expired or is no longer valid.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-tracking-page">
      <div className="tracking-header">
        <div className="tracking-header-content">
          <div className="tracking-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <h1>GuardianLink</h1>
          </div>
          {sessionInfo?.isSosTriggered && (
            <div className="sos-badge">
              🚨 EMERGENCY
            </div>
          )}
        </div>
      </div>

      <div className="tracking-container">
        <div className="tracking-info-card">
          <h2>📍 Live Location Tracking</h2>
          <div className="tracking-user">
            <strong>{sessionInfo?.userName}</strong> is sharing their location with you
          </div>
          <div className="tracking-time">
            <span>Time remaining: <strong>{formatTimeRemaining()}</strong></span>
          </div>
        </div>

        {showMap && location ? (
          <div className="tracking-map-container">
            <FullScreenMapView 
              center={{ lat: location.latitude, lng: location.longitude }}
              onClose={() => {}} // No close button for public view
            />
            <div className="tracking-location-info">
              <p>📍 Last updated: {new Date(location.timestamp).toLocaleString()}</p>
              <p className="tracking-coords">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
              {location.accuracy && (
                <p className="tracking-accuracy">Accuracy: ±{Math.round(location.accuracy)}m</p>
              )}
            </div>
          </div>
        ) : (
          <div className="tracking-waiting">
            <div className="spinner"></div>
            <p>Waiting for location data...</p>
          </div>
        )}

        <div className="tracking-footer">
          <p>🔒 This is a secure, time-limited tracking link</p>
          <p>Powered by GuardianLink</p>
        </div>
      </div>
    </div>
  );
};

const GuardianLinkApp = () => {
    const [authStatus, setAuthStatus] = useState({ isAuthenticated: false, screen: 'landing' }); // 'landing', 'signIn', 'signUp'

    const handleLogin = (userData, token) => {
        setAuthStatus({ isAuthenticated: true, screen: 'landing' });
    };

    const handleSignOut = () => {
        storage.clearAll();
        setAuthStatus({ isAuthenticated: false, screen: 'signIn' });
    };

    // Check if we're on a public tracking page
    const path = window.location.pathname;
    const trackingMatch = path.match(/^\/track\/(\d+)$/);
    
    if (trackingMatch) {
        const sessionId = trackingMatch[1];
        return <PublicTrackingPage sessionId={sessionId} />;
    }

    if (!authStatus.isAuthenticated) {
        switch (authStatus.screen) {
            case 'signIn':
                return <SignInScreen 
                    onLogin={handleLogin} 
                    onNavigateToSignUp={() => setAuthStatus(prev => ({ ...prev, screen: 'signUp' }))} 
                />;
            case 'signUp':
                return <SignUpScreen 
                    onLogin={handleLogin} 
                    onNavigateToSignIn={() => setAuthStatus(prev => ({ ...prev, screen: 'signIn' }))} 
                />;
            case 'landing':
            default:
                return <LandingScreen 
                    onNavigateToSignIn={() => setAuthStatus(prev => ({ ...prev, screen: 'signIn' }))}
                    onNavigateToSignUp={() => setAuthStatus(prev => ({ ...prev, screen: 'signUp' }))}
                />;
        }
    }

    return <App onSignOut={handleSignOut} />;
};


const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <LocalizationProvider>
        <GuardianLinkApp />
    </LocalizationProvider>
);