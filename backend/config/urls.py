from django.contrib import admin
from django.urls import path
from reconcile import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.html_table_view, name='home'),
    path('api/organizations/', views.list_organizations, name='organizations'),
    path('api/disagreements/', views.get_disagreements, name='disagreements'),
]
