from django.contrib import admin
from .models import Contract, ContractEvent, ContractEventImage, ProgressComment, ProgressCommentImage, ProgressImage, ProgressUpdate


class ProgressImageInline(admin.TabularInline):
    model = ProgressImage
    extra = 0
    readonly_fields = ('uploaded_at',)


class ProgressCommentImageInline(admin.TabularInline):
    model = ProgressCommentImage
    extra = 0
    readonly_fields = ('uploaded_at',)


class ProgressCommentInline(admin.TabularInline):
    model = ProgressComment
    extra = 0
    readonly_fields = ('author', 'created_at')


class ProgressUpdateInline(admin.StackedInline):
    model = ProgressUpdate
    extra = 0
    readonly_fields = ('created_at',)
    show_change_link = True


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display  = ('id', 'proposal', 'status', 'created_at', 'completed_at')
    list_filter   = ('status',)
    search_fields = ('proposal__request__title', 'proposal__artisan__username')
    readonly_fields = ('created_at', 'updated_at', 'completed_at')
    inlines       = [ProgressUpdateInline]


@admin.register(ProgressUpdate)
class ProgressUpdateAdmin(admin.ModelAdmin):
    list_display  = ('id', 'contract', 'created_at')
    search_fields = ('contract__proposal__request__title', 'body')
    readonly_fields = ('created_at',)
    inlines       = [ProgressImageInline, ProgressCommentInline]


@admin.register(ProgressComment)
class ProgressCommentAdmin(admin.ModelAdmin):
    list_display  = ('id', 'author', 'update', 'created_at')
    search_fields = ('author__username', 'body')
    readonly_fields = ('created_at',)
    inlines       = [ProgressCommentImageInline]


class ContractEventImageInline(admin.TabularInline):
    model = ContractEventImage
    extra = 0
    readonly_fields = ('uploaded_at',)


@admin.register(ContractEvent)
class ContractEventAdmin(admin.ModelAdmin):
    list_display  = ('id', 'contract', 'event_type', 'actor', 'created_at')
    list_filter   = ('event_type',)
    search_fields = ('contract__proposal__request__title', 'actor__username')
    readonly_fields = ('created_at',)
    inlines       = [ContractEventImageInline]
