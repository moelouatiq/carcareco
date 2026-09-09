export interface IWorkData extends IActivity{ 
    id:              string;
   // number:          string;
   // starterName:     string;
    clientId:        string;
    clientName:      string;
    clientAddress:   string;
    clientEmail:     string;
    clientPhone:     string;
    vehicleId:       string;
    vehicleProducer: string;
    vehicleModel:    string;
    vehicleVin:      string;
    vehicleRegNr:    string;
    notes:           string;
    odo:             number;
    mechanics:       IMechanic[];
    status:          string;
    completedOn?:    string | null;
    issuance:       IWorkIssuance;  
    
}

export interface ICurrentActivity{
    id:        string;
    notes:     string;
    isVehicleLinesOnPricing: boolean;
    products: IProduct[];
    priceSummary: IPriceSummary
}

export interface IActivity{
    id:        string;
    number:    string;
    startedOn: Date;
    startedBy: string;
    name:      string;
    isEmpty: boolean;
}

export interface IWorkIssuance extends IIssuance{
    invoiceNumber: number;
     dueDays: number;
     isPaid:boolean;
}

export interface IOfferIssuance extends IIssuance{
    id: string,
    number: string,
    acceptedOn?: Date;
    acceptedBy?: string;
}

export interface IIssuance{
  
    sentOn?: Date;
    issuedOn: Date;
    issuedBy: string; 
    receiverEmail?: string 

}
export interface IActivities
{ 
    items: IActivity[]
    current: ICurrentActivity
}

export interface IPriceSummary{
    totalWithVat: number,
    totalWithoutVat:number
}

export interface IInvoice {
    isIssued: boolean;
}

export interface IStatus {
    startedOn:     Date;
    invoiceIssued: boolean;
    offers:        IOffer[];
}

export interface IOffer {
    number:   string;
    isIssued: boolean;
}

export interface IProduct
{
    id:       string;
    name:     string;
    quantity: number | null;
    unit:     string;
    price:    number| null;
    discount: number| null;
    code:     string;
    
}
export interface IMechanic{
    id: string,
    name: string,
}

export interface IActivityNames{
    [key: string]: string
    offer: string,
    repairjob: string,
  }
  export interface IStatusNames{
    [key: string]: string
    closed: string,
    inprogress: string,
    completed: string,
  }
 export const activityNames = {
    offer: 'Devis',
    repairjob:'Réparation' 
  } as IActivityNames

  export const statusNames = {
    closed: 'Terminée',
    inprogress:'En cours',
    completed:'Facturée'
  } as IStatusNames
    
  export interface IPaymentNames{
    [key: string]: string
  }

  export const paymentTypes ={ 
    cash:'Espèces',
    banktransfer:'Virement bancaire',
    cardpayment:'Carte bancaire'
  } as IPaymentNames
