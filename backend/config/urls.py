from django.contrib import admin
from django.urls import path
from reconcile import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/organizations/', views.list_organizations, name='organizations'),
    path('api/disagreements/', views.get_disagreements, name='disagreements'),
]
