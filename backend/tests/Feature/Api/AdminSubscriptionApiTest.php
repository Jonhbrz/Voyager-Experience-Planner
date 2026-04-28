<?php

namespace Tests\Feature\Api;

use App\Models\Invoice;
use App\Models\Trip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminSubscriptionApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_upgrade_to_premium_and_invoice_is_created(): void
    {
        $user = User::factory()->create(['plan' => User::PLAN_FREE]);
        Sanctum::actingAs($user);

        $this->postJson('/api/upgrade')
            ->assertOk()
            ->assertJsonPath('data.user.plan', User::PLAN_PREMIUM);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'plan' => User::PLAN_PREMIUM,
        ]);
        $this->assertDatabaseHas('invoices', [
            'user_id' => $user->id,
            'amount' => 999,
            'plan' => User::PLAN_PREMIUM,
        ]);
    }

    public function test_user_cannot_upgrade_twice(): void
    {
        $user = User::factory()->create(['plan' => User::PLAN_FREE]);
        Sanctum::actingAs($user);

        $this->postJson('/api/upgrade')->assertOk();
        $this->postJson('/api/upgrade')->assertStatus(422);
    }

    public function test_user_can_simulate_payment_to_premium_with_card(): void
    {
        $user = User::factory()->create(['plan' => User::PLAN_FREE]);
        Sanctum::actingAs($user);

        $this->postJson('/api/payment/simulate', [
            'method' => 'card',
            'payment_data' => [
                'holder_name' => 'Nombre Prueba',
                'card_number' => '4242424242424242',
                'expiry' => '12/30',
                'cvv' => '123',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.user.plan', User::PLAN_PREMIUM);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'plan' => User::PLAN_PREMIUM,
        ]);
    }

    public function test_user_can_simulate_payment_to_premium_with_transfer(): void
    {
        $user = User::factory()->create(['plan' => User::PLAN_FREE]);
        Sanctum::actingAs($user);

        $this->postJson('/api/payment/simulate', [
            'method' => 'transfer',
            'payment_data' => [
                'iban' => 'ES7921000810131234567890',
                'holder_name' => 'Titular',
                'amount' => '9,99 EUR',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.user.plan', User::PLAN_PREMIUM);
    }

    public function test_premium_user_can_downgrade_to_free(): void
    {
        $user = User::factory()->create(['plan' => User::PLAN_PREMIUM]);
        Sanctum::actingAs($user);

        $this->postJson('/api/downgrade')
            ->assertOk()
            ->assertJsonPath('data.user.plan', User::PLAN_FREE);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'plan' => User::PLAN_FREE,
        ]);
    }

    public function test_free_user_cannot_downgrade(): void
    {
        $user = User::factory()->create(['plan' => User::PLAN_FREE]);
        Sanctum::actingAs($user);

        $this->postJson('/api/downgrade')->assertStatus(422);
    }

    public function test_admin_routes_require_superadmin_role(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => User::ROLE_USER]));

        $this->getJson('/api/admin/users')->assertForbidden();
    }

    public function test_superadmin_can_list_users_and_invoices(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_SUPERADMIN]);
        $user = User::factory()->create(['plan' => User::PLAN_PREMIUM]);
        Invoice::query()->create([
            'user_id' => $user->id,
            'amount' => 999,
            'plan' => User::PLAN_PREMIUM,
        ]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['email' => $user->email]);

        $this->getJson('/api/admin/invoices')
            ->assertOk()
            ->assertJsonPath('data.invoices.0.amount', 999);
    }

    public function test_superadmin_can_view_admin_stats(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_SUPERADMIN, 'plan' => User::PLAN_PREMIUM]);
        $freeUser = User::factory()->create(['plan' => User::PLAN_FREE]);
        $premiumUser = User::factory()->create(['plan' => User::PLAN_PREMIUM]);
        Trip::query()->create([
            'user_id' => $freeUser->id,
            'name' => 'Stats trip',
            'description' => null,
            'start_date' => '2026-11-01',
            'end_date' => '2026-11-02',
        ]);
        Invoice::query()->create([
            'user_id' => $premiumUser->id,
            'amount' => 999,
            'plan' => User::PLAN_PREMIUM,
        ]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/stats')
            ->assertOk()
            ->assertJsonPath('data.stats.total_users', User::query()->count())
            ->assertJsonPath('data.stats.free_users', User::query()->where('plan', User::PLAN_FREE)->count())
            ->assertJsonPath('data.stats.premium_users', User::query()->where('plan', User::PLAN_PREMIUM)->count())
            ->assertJsonPath('data.stats.total_trips', Trip::query()->count())
            ->assertJsonPath('data.stats.total_revenue', (int) Invoice::query()->sum('amount'));
    }

    public function test_superadmin_can_update_user_plan(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_SUPERADMIN]);
        $user = User::factory()->create(['plan' => User::PLAN_FREE]);
        Sanctum::actingAs($admin);

        $this->patchJson("/api/admin/users/{$user->id}/plan", [
            'plan' => User::PLAN_PREMIUM,
        ])
            ->assertOk()
            ->assertJsonPath('data.user.plan', User::PLAN_PREMIUM);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'plan' => User::PLAN_PREMIUM,
        ]);
    }

    public function test_superadmin_cannot_delete_self(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_SUPERADMIN]);
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/users/{$admin->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_superadmin_can_delete_another_user(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_SUPERADMIN]);
        $user = User::factory()->create();
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/users/{$user->id}")
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_superadmin_can_download_invoice_pdf(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_SUPERADMIN]);
        $user = User::factory()->create(['plan' => User::PLAN_PREMIUM]);
        $invoice = Invoice::query()->create([
            'user_id' => $user->id,
            'amount' => 999,
            'plan' => User::PLAN_PREMIUM,
        ]);
        Sanctum::actingAs($admin);

        $response = $this->get("/api/invoices/{$invoice->id}/pdf");
        $response->assertOk();
        $ctype = $response->headers->get('content-type');
        $this->assertNotFalse($ctype);
        $this->assertStringContainsString('application/pdf', $ctype);
        $this->assertNotSame('', $response->getContent());
    }

    public function test_user_can_download_own_invoice_pdf(): void
    {
        $user = User::factory()->create(['plan' => User::PLAN_PREMIUM]);
        $invoice = Invoice::query()->create([
            'user_id' => $user->id,
            'amount' => 999,
            'plan' => User::PLAN_PREMIUM,
        ]);
        Sanctum::actingAs($user);

        $response = $this->get("/api/invoices/{$invoice->id}/pdf");
        $response->assertOk();
        $ctype = $response->headers->get('content-type');
        $this->assertNotFalse($ctype);
        $this->assertStringContainsString('application/pdf', $ctype);
    }

    public function test_user_can_list_own_invoices(): void
    {
        $user = User::factory()->create();
        Invoice::query()->create([
            'user_id' => $user->id,
            'amount' => 999,
            'plan' => User::PLAN_PREMIUM,
        ]);
        Sanctum::actingAs($user);

        $this->getJson('/api/invoices')
            ->assertOk()
            ->assertJsonPath('data.invoices.0.plan', User::PLAN_PREMIUM);
    }

    public function test_user_list_invoices_only_includes_own(): void
    {
        $ownerA = User::factory()->create();
        $ownerB = User::factory()->create();
        Invoice::query()->create([
            'user_id' => $ownerA->id,
            'amount' => 999,
            'plan' => User::PLAN_PREMIUM,
        ]);
        Invoice::query()->create([
            'user_id' => $ownerB->id,
            'amount' => 999,
            'plan' => User::PLAN_PREMIUM,
        ]);
        Sanctum::actingAs($ownerA);

        $response = $this->getJson('/api/invoices')->assertOk();
        $this->assertCount(1, $response->json('data.invoices'));
    }

    public function test_user_cannot_download_another_users_invoice_pdf(): void
    {
        $regular = User::factory()->create(['role' => User::ROLE_USER]);
        $invoiceOwner = User::factory()->create(['plan' => User::PLAN_PREMIUM]);
        $invoice = Invoice::query()->create([
            'user_id' => $invoiceOwner->id,
            'amount' => 999,
            'plan' => User::PLAN_PREMIUM,
        ]);
        Sanctum::actingAs($regular);

        $this->get("/api/invoices/{$invoice->id}/pdf")->assertForbidden();
    }
}
