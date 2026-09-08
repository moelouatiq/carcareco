namespace Carmasters.Core.Application
{
    public interface IAppMapper
    {
        T Map<T>(object source);
    }
}
