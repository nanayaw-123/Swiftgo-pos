-- Function to decrease product stock
CREATE OR REPLACE FUNCTION decrease_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET stock = GREATEST(stock - p_quantity, 0)
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increase product stock
CREATE OR REPLACE FUNCTION increase_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE products
    SET stock = stock + p_quantity
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
