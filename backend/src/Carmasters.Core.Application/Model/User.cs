using Carmasters.Core.Application.Model;
using Carmasters.Core.Domain;
using NHibernate.Bytecode;
using System;
using System.Collections.Generic;

[assembly: System.Runtime.CompilerServices.InternalsVisibleTo("Carmasters.Core.Persistence.Postgres")]

namespace Carmasters.Core.Application.Model
{
}
namespace Carmasters.Core.Application
{
    public class User
    { 
        protected User() { }
        public User(string userName, string password, string email, bool validated, byte[] profileImage,  UserIdentifier id = null)
        {
            if (string.IsNullOrWhiteSpace(userName))
            {
                throw new ArgumentException($"'{nameof(userName)}' cannot be null or whitespace", nameof(userName));
            }

            if (string.IsNullOrWhiteSpace(password))
            {
                throw new ArgumentException($"'{nameof(password)}' cannot be null or whitespace", nameof(password));
            }
            Email = email;
            UserName = userName;
            Password = password;
            Validated = validated;
            ProfileImage = profileImage;
            Id = id;
        }

        public virtual byte[] ProfileImage { get; protected set; }
        public virtual string Email { get; protected set; }

        public virtual bool Validated { get;protected set; }
        public virtual string UserName { get; protected set; }
        public virtual string Password { get;protected set; }
        public virtual UserIdentifier Id { get; protected internal set; }

        public override bool Equals(object obj)
        {
            return obj is User user &&
                   Id == user.Id;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(Id);
        }

        public virtual void ChangeEmail(string email)
        {
            //get validation email?
            this.Email = email;
        }

        /// An avatar is drawn in a circle a few dozen pixels across, so nothing larger than this
        /// serves any purpose, and the previous five megabyte ceiling let a phone photo be sent to
        /// every visitor of every page. The browser scales the picture down before uploading; these
        /// limits are what makes that reduction binding rather than a courtesy.
        public const int MaximumProfileImageDimension = 256;
        public const int MaximumProfileImageBytes = 256 * 1024;

        public virtual void ChangeProfileImage(byte[] profileImage)
        {
            if (profileImage == null || profileImage.Length == 0)
            {
                this.ProfileImage = profileImage;
                return;
            }

            if (profileImage.Length > MaximumProfileImageBytes)
            {
                throw new UserException("L'image de profil est trop volumineuse.");
            }

            // Read from the bytes themselves: a file name or a declared type is chosen by the caller.
            if (!ProfileImageContent.TryRead(profileImage, out var image))
            {
                throw new UserException("Format d'image non reconnu. Formats acceptés : PNG, JPEG, WebP.");
            }

            if (image.Width > MaximumProfileImageDimension || image.Height > MaximumProfileImageDimension)
            {
                throw new UserException(
                    $"L'image de profil ne doit pas dépasser {MaximumProfileImageDimension}x{MaximumProfileImageDimension} pixels.");
            }

            this.ProfileImage = profileImage;
        }

        public virtual void ChangePassword(string v)
        {
            this.Password = v;
        }

        public virtual void ChangeUserName(string userName)
        {
            this.UserName = userName;
        }
    }
}
