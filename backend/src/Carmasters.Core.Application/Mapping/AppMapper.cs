using System;
using System.Linq;
using Carmasters.Core.Domain;
using Carmasters.Http.Api.Models;

namespace Carmasters.Core.Application
{
    public sealed class AppMapper : IAppMapper
    {
        public T Map<T>(object source)
        {
            object mapped = source switch
            {
                Employee employee when typeof(T) == typeof(EmployeeDto) => MapEmployee(employee),
                Storage storage when typeof(T) == typeof(StorageDto) => MapStorage(storage),
                SparePart sparePart when typeof(T) == typeof(SparePartDto) => MapSparePart(sparePart),
                PrivateClient privateClient when typeof(T) == typeof(PrivateClientDto) => MapPrivateClient(privateClient),
                LegalClient legalClient when typeof(T) == typeof(LegalClientDto) => MapLegalClient(legalClient),
                RepairJob when typeof(T) == typeof(RepairJobDto) => new RepairJobDto(),
                _ => throw new InvalidOperationException(
                    $"No application mapping exists from {source?.GetType().Name ?? "null"} to {typeof(T).Name}.")
            };

            return (T)mapped;
        }

        private static EmployeeDto MapEmployee(Employee employee) => new(
            employee.FirstName,
            employee.LastName,
            employee.Phone,
            employee.Email,
            employee.Proffession,
            employee.Description,
            employee.IntroducedAt,
            null,
            null,
            employee.Id);

        private static StorageDto MapStorage(Storage storage) => new(
            storage.Name,
            storage.Address,
            storage.Id,
            storage.Description,
            storage.IntroducedAt);

        private static SparePartDto MapSparePart(SparePart sparePart) => new(
            sparePart.Code,
            sparePart.Name,
            sparePart.Price,
            sparePart.Quantity,
            sparePart.Discount,
            sparePart.Storage?.Id,
            sparePart.Storage?.Name,
            sparePart.Id,
            sparePart.Description,
            sparePart.IntroducedAt);

        private static PrivateClientDto MapPrivateClient(PrivateClient client) => new(
            client.Id,
            client.FirstName,
            client.LastName,
            MapAddress(client.Address),
            client.Phone,
            client.EmailAddresses.Select(email => email.Address).ToArray(),
            client.CurrentEmail,
            client.IsAsshole,
            client.Description,
            client.PersonalCode,
            client.IntroducedAt);

        private static LegalClientDto MapLegalClient(LegalClient client) => new(
            client.Id,
            client.Name,
            client.RegNr,
            MapAddress(client.Address),
            client.Phone,
            client.EmailAddresses.Select(email => email.Address).ToArray(),
            client.CurrentEmail,
            client.IsAsshole,
            client.Description,
            client.IntroducedAt);

        private static AddressDto MapAddress(AddressComponent address) => address is null
            ? null
            : new AddressDto(address.Country, address.Region, address.City, address.Street, address.PostalCode);
    }
}
