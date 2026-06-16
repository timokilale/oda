<?php

namespace Tests\Unit;

use App\Enums\OrderStatus;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_order_status_enum(): void
    {
        $this->assertCount(4, OrderStatus::cases());
        $this->assertEquals(['pending', 'confirmed', 'completed', 'cancelled'], OrderStatus::values());

        $this->assertEquals([OrderStatus::Confirmed, OrderStatus::Cancelled], OrderStatus::Pending->allowedTransitions());
        $this->assertEquals([OrderStatus::Completed, OrderStatus::Cancelled], OrderStatus::Confirmed->allowedTransitions());
        $this->assertEquals([], OrderStatus::Completed->allowedTransitions());
        $this->assertEquals([], OrderStatus::Cancelled->allowedTransitions());
    }
}
