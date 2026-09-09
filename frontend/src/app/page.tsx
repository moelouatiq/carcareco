// src/app/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/_components/layout/Button'
import { Container } from '@/_components/layout/Container' 
import { Header } from '@/_components/layout/Header' 
import Link from 'next/link' 
import { WrenchScrewdriverIcon, UsersIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import FormInput from '@/_components/FormInput'
import { useRouter } from 'next/navigation'

// Interface for demo credentials
interface DemoCredentials {
  username: string;
  password: string;
}

export default function Home() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [credentials, setCredentials] = useState<DemoCredentials | null>(null)
  const [error, setError] = useState('')
  
  const handleOpenDialog = () => {
    setIsDialogOpen(true)
    setCredentials(null)
    setError('')
  }
  
  const handleCreateDemo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!companyName.trim()) {
      setError('Le nom de la société est obligatoire')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/Demo/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName }),
      })
      
      // Handle rate limit error specifically
      if (response.status === 429) {
        const errorData = await response.json();
        setError(errorData.message || 'Trop de tentatives. Merci de réessayer plus tard.');
        setIsLoading(false);
        return;
      }
     
      if (!response.ok) {
        setError('Impossible de créer le compte de démonstration. Merci de réessayer plus tard.');
        setIsLoading(false);
        return;
      }
      
      const data = await response.json()
      setCredentials(data)
    } catch {
      setError('Échec de la création du compte de démonstration. Merci de réessayer plus tard.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <>
      <Header onTryDemoClick={handleOpenDialog} />
      <main className={isDialogOpen ? 'pointer-events-none' : ''}>
        {/* Hero Section - Reduced vertical padding */}
        <Container className="pt-6 pb-10 text-center lg:pt-10">
          <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Un atelier moderne mérite un vrai 
            <span className="relative whitespace-nowrap text-blue-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 418 42"
                className="absolute top-2/3 left-0 h-[0.58em] w-full fill-blue-300/70"
                preserveAspectRatio="none"
              >
                <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
              </svg>
              <span className="relative"> logiciel.</span>
            </span>{' '}
            Auto-hébergé. Gratuit.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base tracking-tight text-slate-700">
            CarCare vous aide à gérer vos réparations, vos véhicules, vos clients,
            vos pièces et vos factures — dans une seule interface claire.
          </p>
          <div className="mt-6 flex justify-center gap-x-6">
            <button
              onClick={handleOpenDialog}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Essayer la démo
            </button>
            <Button
              href="https://github.com/rene98c/carcareco"
              variant="outline"
            >
              Voir sur GitHub
            </Button>
          </div>
        </Container>

        {/* Features Section - Reduced vertical margins */}
        <Container className="mt-4 mb-6">
          <div className="grid grid-cols-1 gap-y-10 md:gap-y-8 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-0">
            <div className="text-center">
              <div className="flex justify-center">
                <WrenchScrewdriverIcon className="h-16 w-16 text-blue-600 mx-auto mb-3" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Des réparations enfin simples</h3>
              <p className="mt-2 text-gray-600">
                Suivez l’avancement, les pièces et la main-d’œuvre. Facturation en un clic.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <UsersIcon className="h-16 w-16 text-blue-600 mx-auto mb-3" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Tous vos clients et véhicules</h3>
              <p className="mt-2 text-gray-600">
                Consultez immédiatement l’historique complet d’un client ou d’un véhicule.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <ArchiveBoxIcon className="h-16 w-16 text-blue-600 mx-auto mb-3" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Stock et pièces détachées</h3>
              <p className="mt-2 text-gray-600">
                Ajoutez vos pièces, appliquez des remises et rattachez-les aux interventions. Fini les tableurs.
              </p>
            </div>
          </div>
        </Container>

        {/* Why CarCare Section - Reduced vertical padding */}
        <div className="bg-slate-50 py-12">
          <Container>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 text-center">Pourquoi CarCare ?</h2>
            <div className="mt-4 max-w-3xl mx-auto">
              <p className="text-base text-slate-700 mb-3">
                Après des années à fréquenter le même garage, le constat était simple :
                leur outil de gestion était, disons, d’époque. Après l’avoir dépanné plusieurs
                fois, l’idée s’est imposée — autant construire quelque chose de mieux.
              </p>
              <p className="text-base text-slate-700">
                CarCare a commencé comme un loisir, est devenu un projet parallèle, et il est
                aujourd’hui open source. Utilisez-le, forkez-le, ou inspirez-vous-en librement.
              </p>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center">
              <div className="flex items-center gap-x-4 mb-4">
                <Link href="https://github.com/rene98c/carcareco" className="text-slate-700 hover:text-slate-900 flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  Mettre une étoile sur GitHub
                </Link>
                <span className="text-slate-400">•</span>
                <Link href="/docs" className="text-slate-700 hover:text-slate-900">Documentation</Link>
                <span className="text-slate-400">•</span>
                <Link href="/auth/login" className="text-slate-700 hover:text-slate-900">Connexion</Link>
              </div>
              <p className="text-sm text-slate-500">
                AGPL 3.0 Licensed. Free and open source software.
              </p>
            </div>
          </Container>
        </div>
      </main>
      
      {/* Custom modal implementation with higher z-index */}
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />
        
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">
                {credentials ? "Compte de démonstration créé" : "Créer un compte de démonstration"}
              </DialogTitle>
              
              {credentials ? (
                <div className="mt-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <p className="mt-4 text-sm text-gray-500">
                    Votre compte de démonstration est prêt. Utilisez les identifiants suivants pour vous connecter :
                  </p>
                  
                  <div className="mt-4 rounded-md bg-gray-50 p-4 border border-gray-200">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <span className="text-sm font-medium text-gray-500">Identifiant :</span>
                      <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 py-1 px-2 rounded select-all">{credentials.username}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-sm font-medium text-gray-500">Mot de passe :</span>
                      <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 py-1 px-2 rounded select-all">{credentials.password}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Remember to save these credentials - you&apos;ll need them to log in!
                  </p>
                  
                  <div className="mt-6">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => router.push('/auth/login')}
                    >
                      Aller à la connexion
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    Indiquez le nom de votre société pour créer un environnement de démonstration dédié
                  </p>
                  
                  <form onSubmit={handleCreateDemo} className="mt-4">
                    <FormInput
                      name="companyName"
                      label="Nom de la société"
                      placeholder="Nom de votre société"
                      defaultValue={companyName}
                      onInputChange={(e) => setCompanyName(e.target.value)}
                      inputError={error}
                    />
                    
                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Création…
                          </span>
                        ) : "Create Demo"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  )
}
