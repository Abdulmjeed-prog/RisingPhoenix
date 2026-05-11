from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="images/avatars/", default="images/avatars/default_avatar.jpg")
    city = models.CharField(1024,default='Saudi arabia')
    phone = models.CharField(max_length=15,blank=True)
    average_rating = models.FloatField(default=0)
    def __str__(self):
        return f"Profile {self.user.username}"
